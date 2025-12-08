# Terraform Test File - Create Bulk Idle Resources for CostGuardian Testing
# This creates multiple idle resources that CostGuardian will detect and delete
# WARNING: These resources will cost money! Run for testing only and destroy afterwards.

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
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region for test resources"
  type        = string
  default     = "us-east-1"
}

variable "resource_count" {
  description = "Number of each resource type to create"
  type        = number
  default     = 5
}

variable "test_prefix" {
  description = "Prefix for test resource names"
  type        = string
  default     = "costguardian-test"
}

# =============================================================================
# VPC and Networking (Required for other resources)
# =============================================================================

resource "aws_vpc" "test_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.test_prefix}-vpc"
    Environment = "test"
    ManagedBy   = "terraform"
    Purpose     = "CostGuardian-Testing"
  }
}

resource "aws_subnet" "test_subnet" {
  count             = 2
  vpc_id            = aws_vpc.test_vpc.id
  cidr_block        = "10.0.${count.index}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.test_prefix}-subnet-${count.index + 1}"
    Environment = "test"
    ManagedBy   = "terraform"
  }
}

resource "aws_internet_gateway" "test_igw" {
  vpc_id = aws_vpc.test_vpc.id

  tags = {
    Name        = "${var.test_prefix}-igw"
    Environment = "test"
    ManagedBy   = "terraform"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# 1. ELASTIC IPs (Unattached - Will be detected as idle)
# =============================================================================

resource "aws_eip" "test_eip" {
  count  = var.resource_count
  domain = "vpc"

  tags = {
    Name        = "${var.test_prefix}-eip-${count.index + 1}"
    Environment = "test"
    ManagedBy   = "terraform"
    Purpose     = "idle-test"
    CreatedAt   = timestamp()
  }
}

# =============================================================================
# 2. NAT GATEWAYS (Idle - No traffic)
# =============================================================================

resource "aws_nat_gateway" "test_nat" {
  count         = var.resource_count
  allocation_id = aws_eip.nat_eip[count.index].id
  subnet_id     = aws_subnet.test_subnet[0].id

  tags = {
    Name        = "${var.test_prefix}-nat-${count.index + 1}"
    Environment = "test"
    ManagedBy   = "terraform"
    Purpose     = "idle-test"
    CreatedAt   = timestamp()
  }

  depends_on = [aws_internet_gateway.test_igw]
}

resource "aws_eip" "nat_eip" {
  count  = var.resource_count
  domain = "vpc"

  tags = {
    Name        = "${var.test_prefix}-nat-eip-${count.index + 1}"
    Environment = "test"
    ManagedBy   = "terraform"
  }
}

# =============================================================================
# 3. EC2 INSTANCES (Stopped or Low CPU - Will be detected as idle)
# =============================================================================

resource "aws_instance" "test_ec2" {
  count         = var.resource_count
  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.test_subnet[0].id

  tags = {
    Name        = "${var.test_prefix}-ec2-${count.index + 1}"
    Environment = "test"
    ManagedBy   = "terraform"
    Purpose     = "idle-test"
    CreatedAt   = timestamp()
  }

  # These instances will be stopped, making them idle
  lifecycle {
    ignore_changes = [ami]
  }
}

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# =============================================================================
# 4. EBS VOLUMES (Unattached - Will be detected as idle)
# =============================================================================

resource "aws_ebs_volume" "test_volume" {
  count             = var.resource_count * 2 # Create more EBS volumes
  availability_zone = data.aws_availability_zones.available.names[0]
  size              = 8 # 8 GB each

  tags = {
    Name        = "${var.test_prefix}-ebs-${count.index + 1}"
    Environment = "test"
    ManagedBy   = "terraform"
    Purpose     = "idle-test"
    CreatedAt   = timestamp()
  }
}

# =============================================================================
# 5. RDS INSTANCES (Small, idle databases)
# =============================================================================

resource "aws_db_subnet_group" "test_db_subnet" {
  name       = "${var.test_prefix}-db-subnet"
  subnet_ids = aws_subnet.test_subnet[*].id

  tags = {
    Name        = "${var.test_prefix}-db-subnet-group"
    Environment = "test"
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "test_rds_sg" {
  name        = "${var.test_prefix}-rds-sg"
  description = "Security group for test RDS instances"
  vpc_id      = aws_vpc.test_vpc.id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.test_prefix}-rds-sg"
    Environment = "test"
    ManagedBy   = "terraform"
  }
}

resource "aws_db_instance" "test_rds" {
  count                  = var.resource_count
  identifier             = "${var.test_prefix}-rds-${count.index + 1}"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_type           = "gp2"
  username               = "admin"
  password               = "TestPassword123!" # Change this!
  skip_final_snapshot    = true
  db_subnet_group_name   = aws_db_subnet_group.test_db_subnet.name
  vpc_security_group_ids = [aws_security_group.test_rds_sg.id]
  publicly_accessible    = false

  tags = {
    Name        = "${var.test_prefix}-rds-${count.index + 1}"
    Environment = "test"
    ManagedBy   = "terraform"
    Purpose     = "idle-test"
    CreatedAt   = timestamp()
  }
}

# =============================================================================
# 6. LOAD BALANCERS (No targets - Will be detected as idle)
# =============================================================================

resource "aws_security_group" "test_alb_sg" {
  name        = "${var.test_prefix}-alb-sg"
  description = "Security group for test ALB"
  vpc_id      = aws_vpc.test_vpc.id

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
    Name        = "${var.test_prefix}-alb-sg"
    Environment = "test"
    ManagedBy   = "terraform"
  }
}

resource "aws_lb" "test_alb" {
  count              = var.resource_count
  name               = "${var.test_prefix}-alb-${count.index + 1}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.test_alb_sg.id]
  subnets            = aws_subnet.test_subnet[*].id

  tags = {
    Name        = "${var.test_prefix}-alb-${count.index + 1}"
    Environment = "test"
    ManagedBy   = "terraform"
    Purpose     = "idle-test"
    CreatedAt   = timestamp()
  }
}

# Target group with no targets (making ALB idle)
resource "aws_lb_target_group" "test_tg" {
  count    = var.resource_count
  name     = "${var.test_prefix}-tg-${count.index + 1}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.test_vpc.id

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
    Name        = "${var.test_prefix}-tg-${count.index + 1}"
    Environment = "test"
    ManagedBy   = "terraform"
  }
}

resource "aws_lb_listener" "test_listener" {
  count             = var.resource_count
  load_balancer_arn = aws_lb.test_alb[count.index].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.test_tg[count.index].arn
  }
}

# =============================================================================
# 7. EBS SNAPSHOTS (Old snapshots for testing)
# =============================================================================

resource "aws_ebs_snapshot" "test_snapshot" {
  count       = var.resource_count
  volume_id   = aws_ebs_volume.test_volume[count.index].id
  description = "Test snapshot for CostGuardian - ${count.index + 1}"

  tags = {
    Name        = "${var.test_prefix}-snapshot-${count.index + 1}"
    Environment = "test"
    ManagedBy   = "terraform"
    Purpose     = "idle-test"
    CreatedAt   = timestamp()
  }
}

# =============================================================================
# 8. S3 BUCKETS (Empty buckets for testing)
# =============================================================================

resource "aws_s3_bucket" "test_bucket" {
  count  = var.resource_count
  bucket = "${var.test_prefix}-bucket-${count.index + 1}-${random_id.bucket_suffix[count.index].hex}"

  tags = {
    Name        = "${var.test_prefix}-bucket-${count.index + 1}"
    Environment = "test"
    ManagedBy   = "terraform"
    Purpose     = "idle-test"
    CreatedAt   = timestamp()
  }
}

resource "random_id" "bucket_suffix" {
  count       = var.resource_count
  byte_length = 4
}

# =============================================================================
# OUTPUTS - Summary of created resources
# =============================================================================

output "summary" {
  description = "Summary of created test resources"
  value = {
    vpc_id                = aws_vpc.test_vpc.id
    elastic_ips_count     = length(aws_eip.test_eip)
    nat_gateways_count    = length(aws_nat_gateway.test_nat)
    ec2_instances_count   = length(aws_instance.test_ec2)
    ebs_volumes_count     = length(aws_ebs_volume.test_volume)
    rds_instances_count   = length(aws_db_instance.test_rds)
    load_balancers_count  = length(aws_lb.test_alb)
    ebs_snapshots_count   = length(aws_ebs_snapshot.test_snapshot)
    s3_buckets_count      = length(aws_s3_bucket.test_bucket)
    total_resources       = (
      length(aws_eip.test_eip) +
      length(aws_nat_gateway.test_nat) +
      length(aws_instance.test_ec2) +
      length(aws_ebs_volume.test_volume) +
      length(aws_db_instance.test_rds) +
      length(aws_lb.test_alb) +
      length(aws_ebs_snapshot.test_snapshot) +
      length(aws_s3_bucket.test_bucket)
    )
  }
}

output "elastic_ip_ids" {
  description = "List of Elastic IP allocation IDs"
  value       = aws_eip.test_eip[*].id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.test_nat[*].id
}

output "ec2_instance_ids" {
  description = "List of EC2 Instance IDs"
  value       = aws_instance.test_ec2[*].id
}

output "ebs_volume_ids" {
  description = "List of EBS Volume IDs"
  value       = aws_ebs_volume.test_volume[*].id
}

output "rds_instance_ids" {
  description = "List of RDS Instance IDs"
  value       = aws_db_instance.test_rds[*].id
}

output "load_balancer_arns" {
  description = "List of Load Balancer ARNs"
  value       = aws_lb.test_alb[*].arn
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost of all test resources (USD)"
  value = {
    elastic_ips     = length(aws_eip.test_eip) * 3.60
    nat_gateways    = length(aws_nat_gateway.test_nat) * 32.40
    ec2_instances   = length(aws_instance.test_ec2) * 8.50
    ebs_volumes     = length(aws_ebs_volume.test_volume) * 0.80
    rds_instances   = length(aws_db_instance.test_rds) * 15.00
    load_balancers  = length(aws_lb.test_alb) * 16.20
    total_estimated = (
      (length(aws_eip.test_eip) * 3.60) +
      (length(aws_nat_gateway.test_nat) * 32.40) +
      (length(aws_instance.test_ec2) * 8.50) +
      (length(aws_ebs_volume.test_volume) * 0.80) +
      (length(aws_db_instance.test_rds) * 15.00) +
      (length(aws_lb.test_alb) * 16.20)
    )
  }
}

output "next_steps" {
  description = "What to do next"
  value = <<-EOT
  
  ✅ Test resources created successfully!
  
  Next Steps:
  1. Wait 10-15 minutes for resources to be fully provisioned
  2. Run your CostGuardian Lambda function to detect these idle resources
  3. Check your dashboard - it should show all these resources
  4. Let CostGuardian delete them or manually test the deletion logic
  5. IMPORTANT: Run 'terraform destroy' when done to avoid charges!
  
  To stop EC2 instances (make them idle):
    aws ec2 stop-instances --instance-ids ${join(" ", aws_instance.test_ec2[*].id)}
  
  To destroy all test resources:
    terraform destroy -auto-approve
  
  Estimated Monthly Cost: $${(
    (length(aws_eip.test_eip) * 3.60) +
    (length(aws_nat_gateway.test_nat) * 32.40) +
    (length(aws_instance.test_ec2) * 8.50) +
    (length(aws_ebs_volume.test_volume) * 0.80) +
    (length(aws_db_instance.test_rds) * 15.00) +
    (length(aws_lb.test_alb) * 16.20)
  )}
  
  EOT
}
