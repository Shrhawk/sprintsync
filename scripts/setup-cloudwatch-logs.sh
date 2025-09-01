#!/bin/bash

# SprintSync CloudWatch Log Groups Setup Script
# This script creates the necessary CloudWatch log groups for the production deployment

set -e

# Default AWS region
AWS_REGION=${AWS_REGION:-us-east-1}

echo "🚀 Setting up CloudWatch log groups for SprintSync in region: $AWS_REGION"

# Function to create log group if it doesn't exist
create_log_group() {
    local log_group=$1
    local retention_days=$2
    
    echo "📋 Creating log group: $log_group"
    
    # Check if log group exists
    if aws logs describe-log-groups --region "$AWS_REGION" --log-group-name-prefix "$log_group" --query "logGroups[?logGroupName=='$log_group'].logGroupName" --output text | grep -q "$log_group"; then
        echo "   ✅ Log group $log_group already exists"
    else
        # Create the log group
        aws logs create-log-group --region "$AWS_REGION" --log-group-name "$log_group"
        echo "   ✅ Created log group: $log_group"
    fi
    
    # Set retention policy
    aws logs put-retention-policy --region "$AWS_REGION" --log-group-name "$log_group" --retention-in-days "$retention_days"
    echo "   📅 Set retention policy to $retention_days days"
}

# Create all log groups (matching CI/CD pipeline naming)
create_log_group "/sprintsync/prod/database" "90"
create_log_group "/sprintsync/prod/backend" "90"
create_log_group "/sprintsync/prod/frontend" "90"
create_log_group "/sprintsync/prod/seeder" "90"
create_log_group "/sprintsync/prod/system" "90"

echo ""
echo "🎉 CloudWatch log groups setup complete!"
echo ""
echo "📊 Log groups created (matching CI/CD pipeline):"
echo "   - /sprintsync/prod/database (90 days retention)"
echo "   - /sprintsync/prod/backend (90 days retention)"
echo "   - /sprintsync/prod/frontend (90 days retention)"
echo "   - /sprintsync/prod/seeder (90 days retention)"
echo "   - /sprintsync/prod/system (90 days retention)"

echo ""
echo "💡 You can view logs in the AWS Console at:"
echo "   https://$AWS_REGION.console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#logsV2:log-groups"
echo ""
echo "🔧 To stream logs from command line, use:"
echo "   aws logs tail /sprintsync/prod/backend --region $AWS_REGION --follow"
echo "   aws logs tail /sprintsync/prod/frontend --region $AWS_REGION --follow"
echo "   aws logs tail /sprintsync/prod/database --region $AWS_REGION --follow"
