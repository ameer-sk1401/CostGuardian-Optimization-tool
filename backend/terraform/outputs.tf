
# ============================================
# OUTPUTS
# ============================================

output "test_resources_created" {
  description = "Summary of test resources created"
  value = {
    ec2_instance_id   = var.enable_ec2_test ? aws_instance.idle_test[0].id : "not created"
    elastic_ip        = var.enable_elastic_ip_test ? aws_eip.unattached_test[0].public_ip : "not created"
    nat_gateway_id    = var.enable_nat_gateway_test ? aws_nat_gateway.idle_test[0].id : "not created"
    ebs_volume_id     = var.enable_ebs_test ? aws_ebs_volume.unattached_test[0].id : "not created"
    load_balancer_arn = var.enable_load_balancer_test ? aws_lb.idle_test[0].arn : "not created"
    vpc_id            = var.enable_vpc_test ? aws_vpc.empty_test[0].id : "not created"
    rds_instance_id   = var.enable_rds_test ? aws_db_instance.idle_test[0].id : "not created"
  }
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost of test resources"
  value = {
    ec2_instance         = var.enable_ec2_test ? "$8.40" : "$0"
    elastic_ip           = var.enable_elastic_ip_test ? "$3.60" : "$0"
    nat_gateway          = var.enable_nat_gateway_test ? "$32.40" : "$0"
    ebs_volume           = var.enable_ebs_test ? "$8.00" : "$0"
    load_balancer        = var.enable_load_balancer_test ? "$16.20" : "$0"
    vpc                  = var.enable_vpc_test ? "$0 (free)" : "$0"
    rds_instance         = var.enable_rds_test ? "$50.00" : "$0"
    total_if_all_enabled = "$118.60/month"
  }
}

output "costguardian_test_instructions" {
  description = "How to test CostGuardian with these resources"
  value       = <<-EOT
  
  ============================================
  COSTGUARDIAN TEST INSTRUCTIONS
  ============================================
  
  1. Resources have been created and are now idle/wasteful
  
  2. CostGuardian will detect them based on these timelines:
     - EC2: After 18 hours of <10% CPU usage
     - Elastic IP: After 7 days unattached
     - NAT Gateway: After 7 days with <1MB traffic
     - EBS Volume: After 7 days unattached
     - Load Balancer: Immediately (0 healthy targets)
     - VPC: After 7 days empty
     - RDS: After 7 days with 0 connections
  
  3. Check CostGuardian monitoring:
     - DynamoDB: CostGuardianResourceLogs table
     - SNS: Email notifications
     - CloudWatch Dashboard: Metrics
     - Lambda Logs: Detailed detection logs
  
  4. Expected Actions by CostGuardian:
     - EC2: Stop → Quarantine → Terminate (with AMI backup)
     - Elastic IP: Release (after warning)
     - NAT Gateway: Delete (with config backup)
     - EBS: Snapshot → Delete
     - Load Balancer: Delete (with config backup)
     - VPC: Cleanup subnets → Delete VPC
     - RDS: Stop → Snapshot → Delete
  
  5. To manually cleanup (if needed):
     terraform destroy
  
  6. Estimated Cost Impact:
     - Monthly cost if left running: See output above
     - CostGuardian will eliminate these costs within 7-18 hours
  
  7. Monitor Progress:
     - CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=CostGuardian-Overview
     - DynamoDB: https://console.aws.amazon.com/dynamodb/home?region=us-east-1#tables:selected=CostGuardianResourceLogs
  
  ============================================
  EOT
}

output "quick_verification_commands" {
  description = "AWS CLI commands to verify resources were created"
  value       = <<-EOT
  
  # Verify EC2 instance
  aws ec2 describe-instances --filters "Name=tag:Name,Values=${var.test_identifier}-idle-ec2" --region us-east-1
  
  # Verify Elastic IP
  aws ec2 describe-addresses --filters "Name=tag:Name,Values=${var.test_identifier}-unattached-eip" --region us-east-1
  
  # Verify NAT Gateway
  aws ec2 describe-nat-gateways --filter "Name=tag:Name,Values=${var.test_identifier}-idle-nat" --region us-east-1
  
  # Verify EBS Volume
  aws ec2 describe-volumes --filters "Name=tag:Name,Values=${var.test_identifier}-unattached-ebs" --region us-east-1
  
  # Verify Load Balancer
  aws elbv2 describe-load-balancers --region us-east-1 | grep ${var.test_identifier}
  
  # Verify VPC
  aws ec2 describe-vpcs --filters "Name=tag:Name,Values=${var.test_identifier}-empty-vpc" --region us-east-1
  
  EOT
}
