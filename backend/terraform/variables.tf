# ============================================
# VARIABLES
# ============================================

variable "test_identifier" {
  description = "Unique identifier for this test run"
  type        = string
  default     = "cgtest"
}

variable "enable_nat_gateway_test" {
  description = "Create NAT Gateway for testing ($32.40/month)"
  type        = bool
  default     = true
}

variable "enable_elastic_ip_test" {
  description = "Create unattached Elastic IP for testing ($3.60/month)"
  type        = bool
  default     = true
}

variable "enable_ebs_test" {
  description = "Create unattached EBS volume for testing ($8/month)"
  type        = bool
  default     = true
}

variable "enable_ec2_test" {
  description = "Create idle EC2 instance for testing ($8.40/month)"
  type        = bool
  default     = true
}

variable "enable_rds_test" {
  description = "Create idle RDS instance for testing (WARNING: ~$50/month)"
  type        = bool
  default     = false # Expensive! Enable only if needed
}

variable "enable_load_balancer_test" {
  description = "Create idle ALB for testing ($16.20/month)"
  type        = bool
  default     = true
}

variable "enable_vpc_test" {
  description = "Create empty VPC for testing (free but creates clutter)"
  type        = bool
  default     = true
}