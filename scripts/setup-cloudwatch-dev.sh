#!/bin/bash

# SprintSync CloudWatch Log Groups Setup for Development Environment
# This script creates and configures CloudWatch log groups for dev deployment

set -e

echo "🔍 Setting up CloudWatch logging for SprintSync Development Environment..."

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
LOG_GROUP_PREFIX="/sprintsync/dev"
RETENTION_DAYS=30  # 30 days retention for development logs

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if AWS CLI is configured
check_aws_credentials() {
    echo -e "${BLUE}🔐 Checking AWS credentials...${NC}"
    
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        echo -e "${RED}❌ AWS credentials not configured or invalid.${NC}"
        echo -e "${YELLOW}Please configure AWS CLI with: aws configure${NC}"
        echo -e "${YELLOW}Or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables${NC}"
        exit 1
    fi
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo -e "${GREEN}✅ AWS credentials configured for account: ${ACCOUNT_ID}${NC}"
}

# Function to create log group
create_log_group() {
    local log_group_name=$1
    local description=$2
    
    echo -e "${BLUE}📝 Creating log group: ${log_group_name}${NC}"
    
    # Check if log group already exists
    if aws logs describe-log-groups --log-group-name-prefix "$log_group_name" --region "$AWS_REGION" | grep -q "$log_group_name"; then
        echo -e "${YELLOW}⚠️  Log group ${log_group_name} already exists, skipping creation${NC}"
    else
        # Create log group
        if aws logs create-log-group \
            --log-group-name "$log_group_name" \
            --region "$AWS_REGION" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Created log group: ${log_group_name}${NC}"
        else
            echo -e "${RED}❌ Failed to create log group: ${log_group_name}${NC}"
            return 1
        fi
    fi
    
    # Set retention policy
    echo -e "${BLUE}⏰ Setting retention policy to ${RETENTION_DAYS} days...${NC}"
    if aws logs put-retention-policy \
        --log-group-name "$log_group_name" \
        --retention-in-days "$RETENTION_DAYS" \
        --region "$AWS_REGION" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Set retention policy for ${log_group_name}${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not set retention policy for ${log_group_name}${NC}"
    fi
    
    # Add tags
    if aws logs tag-log-group \
        --log-group-name "$log_group_name" \
        --tags "Environment=development,Project=SprintSync,Service=${description}" \
        --region "$AWS_REGION" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Added tags to ${log_group_name}${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not add tags to ${log_group_name}${NC}"
    fi
    
    echo ""
}

# Function to setup IAM role for CloudWatch (if it doesn't exist)
setup_cloudwatch_iam_role() {
    echo -e "${BLUE}👤 Setting up IAM role for CloudWatch agent...${NC}"
    
    ROLE_NAME="CloudWatchAgentServerRole"
    
    # Check if role exists
    if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  IAM role ${ROLE_NAME} already exists${NC}"
    else
        echo -e "${BLUE}📝 Creating IAM role: ${ROLE_NAME}${NC}"
        
        # Create trust policy
        cat > /tmp/cloudwatch-trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF
        
        # Create role
        if aws iam create-role \
            --role-name "$ROLE_NAME" \
            --assume-role-policy-document file:///tmp/cloudwatch-trust-policy.json \
            --description "Role for CloudWatch agent on EC2 instances" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Created IAM role: ${ROLE_NAME}${NC}"
        else
            echo -e "${RED}❌ Failed to create IAM role: ${ROLE_NAME}${NC}"
        fi
        
        # Attach CloudWatch agent policy
        if aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Attached CloudWatchAgentServerPolicy to ${ROLE_NAME}${NC}"
        else
            echo -e "${YELLOW}⚠️  Could not attach CloudWatchAgentServerPolicy${NC}"
        fi
        
        # Create instance profile
        if aws iam create-instance-profile \
            --instance-profile-name "$ROLE_NAME" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Created instance profile: ${ROLE_NAME}${NC}"
            
            # Add role to instance profile
            if aws iam add-role-to-instance-profile \
                --instance-profile-name "$ROLE_NAME" \
                --role-name "$ROLE_NAME" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ Added role to instance profile${NC}"
            else
                echo -e "${YELLOW}⚠️  Could not add role to instance profile${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Could not create instance profile${NC}"
        fi
        
        # Clean up
        rm -f /tmp/cloudwatch-trust-policy.json
    fi
    
    echo ""
}

# Function to list created log groups
list_log_groups() {
    echo -e "${BLUE}📋 Listing created log groups:${NC}"
    echo ""
    
    aws logs describe-log-groups \
        --log-group-name-prefix "$LOG_GROUP_PREFIX" \
        --region "$AWS_REGION" \
        --query 'logGroups[*].[logGroupName,retentionInDays,storedBytes]' \
        --output table
    
    echo ""
    echo -e "${GREEN}🔗 CloudWatch Console URL:${NC}"
    echo "https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#logsV2:log-groups"
    echo ""
}

# Main execution
main() {
    echo -e "${GREEN}🚀 SprintSync CloudWatch Setup${NC}"
    echo "=================================="
    echo ""
    
    # Check prerequisites
    check_aws_credentials
    echo ""
    
    # Setup IAM role for CloudWatch (if needed)
    setup_cloudwatch_iam_role
    
    # Create log groups for each service
    echo -e "${BLUE}📝 Creating log groups for SprintSync services...${NC}"
    echo ""
    
    create_log_group "${LOG_GROUP_PREFIX}/frontend" "frontend"
    create_log_group "${LOG_GROUP_PREFIX}/backend" "backend"
    create_log_group "${LOG_GROUP_PREFIX}/database" "database"
    create_log_group "${LOG_GROUP_PREFIX}/docker" "docker-containers"
    
    # List created log groups
    list_log_groups
    
    echo -e "${GREEN}✅ CloudWatch logging setup completed!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Deploy your application using the updated docker-compose.dev.yml"
    echo "2. Check logs in AWS CloudWatch console"
    echo "3. Configure log retention and monitoring as needed"
    echo ""
    echo -e "${BLUE}💡 Tip: You can view logs using AWS CLI:${NC}"
    echo "aws logs tail ${LOG_GROUP_PREFIX}/backend --follow --region ${AWS_REGION}"
    echo "aws logs tail ${LOG_GROUP_PREFIX}/frontend --follow --region ${AWS_REGION}"
    echo "aws logs tail ${LOG_GROUP_PREFIX}/database --follow --region ${AWS_REGION}"
}

# Run main function
main "$@"
