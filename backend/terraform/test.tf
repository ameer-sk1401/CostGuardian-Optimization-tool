terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "CostGuardian"
      Environment = "Test"
      ManagedBy   = "Terraform"
      Purpose     = "Idle Resource Testing"
      CreatedBy   = "CostGuardian-Test"
    }
  }
}

# ============================================
# DATA SOURCES
# ============================================

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Get default VPC (for resources that need it)
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================
# TEST 1: IDLE EC2 INSTANCE
# ============================================
# Will be detected after 18 hours of <10% CPU usage
# Cost: ~$8.40/month (t3.micro)

resource "aws_instance" "idle_test" {
  count = var.enable_ec2_test ? 1 : 0

  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  tags = {
    Name           = "${var.test_identifier}-idle-ec2"
    TestResource   = "true"
    ExpectedAction = "CostGuardian should stop then terminate after 18hrs idle"
  }

  # No user_data = completely idle instance
  # CostGuardian should detect CPU < 10%
}

# ============================================
# TEST 2: UNATTACHED ELASTIC IP
# ============================================
# Will be detected after 7 days unattached
# Cost: $3.60/month

resource "aws_eip" "unattached_test" {
  count = var.enable_elastic_ip_test ? 1 : 0

  domain = "vpc"

  tags = {
    Name           = "${var.test_identifier}-unattached-eip"
    TestResource   = "true"
    ExpectedAction = "CostGuardian should release after 7 days"
  }

  # Intentionally NOT attached to any instance
}

# ============================================
# TEST 3: NAT GATEWAY (EXPENSIVE!)
# ============================================
# Will be detected after <1MB data in 7 days
# Cost: $32.40/month
# Note: This is the most expensive test resource

resource "aws_eip" "nat_test" {
  count = var.enable_nat_gateway_test ? 1 : 0

  domain = "vpc"

  tags = {
    Name         = "${var.test_identifier}-nat-eip"
    TestResource = "true"
  }
}

resource "aws_nat_gateway" "idle_test" {
  count = var.enable_nat_gateway_test ? 1 : 0

  allocation_id = aws_eip.nat_test[0].id
  subnet_id     = data.aws_subnets.default.ids[0]

  tags = {
    Name           = "${var.test_identifier}-idle-nat"
    TestResource   = "true"
    ExpectedAction = "CostGuardian should delete after 7 days <1MB traffic"
  }

  # No route table associations = no traffic = idle
}

# ============================================
# TEST 4: UNATTACHED EBS VOLUME
# ============================================
# Will be detected after 7 days unattached
# Cost: $8/month (100GB gp3)

resource "aws_ebs_volume" "unattached_test" {
  count = var.enable_ebs_test ? 1 : 0

  availability_zone = data.aws_availability_zones.available.names[0]
  size              = 100
  type              = "gp3"

  tags = {
    Name           = "${var.test_identifier}-unattached-ebs"
    TestResource   = "true"
    ExpectedAction = "CostGuardian should snapshot and delete after 7 days"
  }

  # Intentionally NOT attached to any instance
}

# ============================================
# TEST 5: IDLE APPLICATION LOAD BALANCER
# ============================================
# Will be detected after 0 healthy targets
# Cost: $16.20/month

resource "aws_lb" "idle_test" {
  count = var.enable_load_balancer_test ? 1 : 0

  name               = "${var.test_identifier}-idle-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_test[0].id]
  subnets            = data.aws_subnets.default.ids

  enable_deletion_protection = false

  tags = {
    Name           = "${var.test_identifier}-idle-alb"
    TestResource   = "true"
    ExpectedAction = "CostGuardian should delete after detecting 0 healthy targets"
  }
}

resource "aws_security_group" "alb_test" {
  count = var.enable_load_balancer_test ? 1 : 0

  name        = "${var.test_identifier}-alb-sg"
  description = "Test security group for idle ALB"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name         = "${var.test_identifier}-alb-sg"
    TestResource = "true"
  }
}

resource "aws_lb_target_group" "test" {
  count = var.enable_load_balancer_test ? 1 : 0

  name     = "${var.test_identifier}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name         = "${var.test_identifier}-tg"
    TestResource = "true"
  }
}

resource "aws_lb_listener" "test" {
  count = var.enable_load_balancer_test ? 1 : 0

  load_balancer_arn = aws_lb.idle_test[0].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.test[0].arn
  }
}

# ============================================
# TEST 6: EMPTY VPC
# ============================================
# Will be detected after no resources attached for 7 days
# Cost: Free (but creates clutter)

resource "aws_vpc" "empty_test" {
  count = var.enable_vpc_test ? 1 : 0

  cidr_block           = "10.99.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name           = "${var.test_identifier}-empty-vpc"
    TestResource   = "true"
    ExpectedAction = "CostGuardian should delete after 7 days with no resources"
  }
}

resource "aws_subnet" "empty_test" {
  count = var.enable_vpc_test ? 1 : 0

  vpc_id            = aws_vpc.empty_test[0].id
  cidr_block        = "10.99.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name           = "${var.test_identifier}-empty-subnet"
    TestResource   = "true"
    ExpectedAction = "CostGuardian should delete orphaned subnet"
  }
}

# ============================================
# TEST 7: IDLE RDS INSTANCE (EXPENSIVE - DISABLED BY DEFAULT)
# ============================================
# Will be detected after 0 connections for 7 days
# Cost: ~$50/month (db.t3.micro)
# WARNING: Only enable if you want to test RDS monitoring

resource "aws_db_instance" "idle_test" {
  count = var.enable_rds_test ? 1 : 0

  identifier        = "${var.test_identifier}-idle-rds"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.micro"
  allocated_storage = 20

  db_name  = "testdb"
  username = "admin"
  password = "TestPassword123!" # Change this!

  skip_final_snapshot = true
  publicly_accessible = false

  tags = {
    Name           = "${var.test_identifier}-idle-rds"
    TestResource   = "true"
    ExpectedAction = "CostGuardian should stop then delete after 7 days with 0 connections"
  }

  # No application connections = idle
}