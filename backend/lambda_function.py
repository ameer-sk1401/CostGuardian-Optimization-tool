# ============================================
# LAMBDA 2: DATA EXPORT TO GITHUB (NO EXTERNAL DEPENDENCIES)
# ============================================
# Function Name: CostGuardian-DataExporter
# Trigger: DynamoDB Stream on CostGuardianResourceLogs
# Purpose: Export dashboard data to GitHub for static website
# Runtime: Python 3.12
# Memory: 256 MB
# Timeout: 60 seconds
# Dependencies: NONE (uses only boto3 which is built-in)
# ============================================

import json
import boto3
import os
from datetime import datetime, timedelta
from decimal import Decimal
import base64
import urllib.request
import urllib.error

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
s3_client = boto3.client('s3', region_name='us-east-1')

# Configuration from environment variables
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'CostGuardianResourceLogs')
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')  # GitHub Personal Access Token
GITHUB_REPO = os.environ.get('GITHUB_REPO')    # e.g., "username/costguardian-dashboard"
GITHUB_BRANCH = os.environ.get('GITHUB_BRANCH', 'main')
DATA_FILE_PATH = os.environ.get('DATA_FILE_PATH', 'public/data.json')

def lambda_handler(event, context):
    """
    Triggered by DynamoDB Stream when CostGuardian logs changes
    Exports aggregated data to GitHub for dashboard consumption
    """
    
    print("="*60)
    print("🚀 DATA EXPORT LAMBDA STARTED")
    print("="*60)
    
    try:
        # Step 1: Fetch all data from DynamoDB
        print("\n📊 Step 1: Fetching data from DynamoDB...")
        dashboard_data = fetch_and_aggregate_data()
        
        # Step 2: Validate data quality (CI step!)
        print("\n✅ Step 2: Validating data quality (CI)...")
        validate_data(dashboard_data)
        
        # Step 3: Push to GitHub
        print("\n🔄 Step 3: Pushing to GitHub...")
        push_to_github(dashboard_data)
        
        print("\n" + "="*60)
        print("✅ DATA EXPORT COMPLETED SUCCESSFULLY")
        print("="*60)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data exported successfully',
                'stats': {
                    'total_resources': dashboard_data['overview']['total_resources'],
                    'monthly_savings': float(dashboard_data['overview']['monthly_savings']),
                    'last_updated': dashboard_data['metadata']['last_updated']
                }
            })
        }
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }


def fetch_and_aggregate_data():
    """
    Fetch all CostGuardian data from DynamoDB and aggregate it
    Returns formatted data structure for dashboard
    """
    table = dynamodb.Table(DYNAMODB_TABLE)
    
    # Scan entire table
    print("  📥 Scanning DynamoDB table...")
    response = table.scan()
    items = response.get('Items', [])
    
    # Handle pagination if needed
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response.get('Items', []))
    
    print(f"  ✓ Found {len(items)} total log entries")
    
    # Aggregate data
    print("  🔄 Aggregating data...")
    
    # Track unique resources (latest state only)
    unique_resources = {}
    for item in items:
        resource_id = item.get('ResourceID')
        timestamp = item.get('Timestamp', '')
        
        if resource_id not in unique_resources:
            unique_resources[resource_id] = item
        else:
            # Keep most recent entry
            if timestamp > unique_resources[resource_id].get('Timestamp', ''):
                unique_resources[resource_id] = item
    
    print(f"  ✓ Found {len(unique_resources)} unique resources")
    
    # Calculate overview statistics
    overview = calculate_overview(unique_resources)
    
    # Get resource breakdown by type
    breakdown = calculate_breakdown(unique_resources)
    
    # Get recent activity (last 30 days)
    activity = calculate_activity(items)
    
    # Get current resources being monitored
    current_resources = get_current_resources(unique_resources)
    
    # Get deletion history
    deleted_resources = get_deleted_resources(unique_resources)
    
    # Create dashboard data structure
    dashboard_data = {
        'metadata': {
            'last_updated': datetime.utcnow().isoformat() + 'Z',
            'version': '1.0',
            'total_log_entries': len(items),
            'unique_resources': len(unique_resources)
        },
        'overview': overview,
        'breakdown': breakdown,
        'activity': activity,
        'current_resources': current_resources,
        'deleted_resources': deleted_resources
    }
    
    print("  ✓ Data aggregation complete")
    
    return dashboard_data


def calculate_overview(unique_resources):
    """Calculate high-level overview statistics"""
    
    total_resources = len(unique_resources)
    deleted_count = 0
    idle_count = 0
    active_count = 0
    total_monthly_savings = 0.0
    
    for resource_id, resource in unique_resources.items():
        status = resource.get('Status', 'Unknown')
        monthly_cost = float(resource.get('MonthlyCost', 0))
        
        if status in ['Deleted', 'Released', 'Terminated']:
            deleted_count += 1
            total_monthly_savings += monthly_cost
        elif status in ['Idle-Warning', 'Idle', 'Quarantine', 'Stopped', 'Available', 'Unattached', 'Empty']:
            idle_count += 1
        elif status == 'Active':
            active_count += 1
    
    return {
        'total_resources': total_resources,
        'resources_deleted': deleted_count,
        'idle_resources': idle_count,
        'active_resources': active_count,
        'monthly_savings': round(total_monthly_savings, 2),
        'annual_savings': round(total_monthly_savings * 12, 2)
    }


def calculate_breakdown(unique_resources):
    """Calculate savings breakdown by resource type"""
    
    breakdown = {}
    
    for resource_id, resource in unique_resources.items():
        resource_type = resource.get('ResourceType', 'Unknown')
        status = resource.get('Status', 'Unknown')
        monthly_cost = float(resource.get('MonthlyCost', 0))
        
        if resource_type not in breakdown:
            breakdown[resource_type] = {
                'count': 0,
                'deleted': 0,
                'idle': 0,
                'active': 0,
                'monthly_savings': 0.0
            }
        
        breakdown[resource_type]['count'] += 1
        
        if status in ['Deleted', 'Released', 'Terminated']:
            breakdown[resource_type]['deleted'] += 1
            breakdown[resource_type]['monthly_savings'] += monthly_cost
        elif status in ['Idle-Warning', 'Idle', 'Quarantine', 'Stopped', 'Available', 'Unattached', 'Empty']:
            breakdown[resource_type]['idle'] += 1
        elif status == 'Active':
            breakdown[resource_type]['active'] += 1
    
    # Round savings
    for resource_type in breakdown:
        breakdown[resource_type]['monthly_savings'] = round(breakdown[resource_type]['monthly_savings'], 2)
    
    return breakdown


def calculate_activity(items):
    """Calculate activity timeline for last 30 days"""
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Group by date
    daily_activity = {}
    
    for item in items:
        timestamp_str = item.get('Timestamp', '')
        
        # Parse timestamp
        try:
            if 'T' in timestamp_str:
                timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            else:
                timestamp = datetime.strptime(timestamp_str[:10], '%Y-%m-%d')
        except:
            continue
        
        # Skip if older than 30 days
        if timestamp < thirty_days_ago:
            continue
        
        date_key = timestamp.strftime('%Y-%m-%d')
        
        if date_key not in daily_activity:
            daily_activity[date_key] = {
                'date': date_key,
                'deleted': 0,
                'warned': 0,
                'active': 0
            }
        
        status = item.get('Status', '')
        
        if status in ['Deleted', 'Released', 'Terminated']:
            daily_activity[date_key]['deleted'] += 1
        elif status in ['Idle-Warning', 'Idle', 'Quarantine']:
            daily_activity[date_key]['warned'] += 1
        elif status == 'Active':
            daily_activity[date_key]['active'] += 1
    
    # Convert to sorted list
    activity_list = sorted(daily_activity.values(), key=lambda x: x['date'])
    
    return activity_list


def get_current_resources(unique_resources):
    """Get list of currently monitored resources with latest status"""
    
    current = []
    
    for resource_id, resource in unique_resources.items():
        status = resource.get('Status', 'Unknown')
        
        # Skip deleted resources
        if status in ['Deleted', 'Released', 'Terminated']:
            continue
        
        current.append({
            'resource_id': resource_id,
            'resource_type': resource.get('ResourceType', 'Unknown'),
            'status': status,
            'monthly_cost': float(resource.get('MonthlyCost', 0)),
            'last_checked': resource.get('Timestamp', ''),
            'region': resource.get('Region', 'us-east-1')
        })
    
    # Sort by monthly cost (highest first)
    current.sort(key=lambda x: x['monthly_cost'], reverse=True)
    
    return current


def get_deleted_resources(unique_resources):
    """Get list of deleted resources with savings info"""
    
    deleted = []
    
    for resource_id, resource in unique_resources.items():
        status = resource.get('Status', 'Unknown')
        
        # Only include deleted resources
        if status not in ['Deleted', 'Released', 'Terminated']:
            continue
        
        deleted.append({
            'resource_id': resource_id,
            'resource_type': resource.get('ResourceType', 'Unknown'),
            'status': status,
            'monthly_savings': float(resource.get('MonthlyCost', 0)),
            'deleted_at': resource.get('Timestamp', ''),
            'backup_location': resource.get('BackupLocation', 'N/A')
        })
    
    # Sort by deletion date (most recent first)
    deleted.sort(key=lambda x: x['deleted_at'], reverse=True)
    
    return deleted


def validate_data(data):
    """
    CI Step: Validate data quality before pushing to GitHub
    Raises exception if validation fails
    """
    
    print("  🔍 Running data validation checks...")
    
    # Check required fields exist
    required_fields = ['metadata', 'overview', 'breakdown', 'activity', 'current_resources', 'deleted_resources']
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")
    
    # Validate overview numbers
    overview = data['overview']
    if overview['monthly_savings'] < 0:
        raise ValueError("Monthly savings cannot be negative")
    
    if overview['total_resources'] < 0:
        raise ValueError("Total resources cannot be negative")
    
    # Validate metadata
    if 'last_updated' not in data['metadata']:
        raise ValueError("Missing last_updated in metadata")
    
    # Validate JSON serializable
    try:
        json.dumps(data, cls=DecimalEncoder)
    except Exception as e:
        raise ValueError(f"Data is not JSON serializable: {str(e)}")
    
    print("  ✓ All validation checks passed!")
    
    return True


def push_to_github(data):
    """
    Push data.json to GitHub repository using urllib (no external dependencies!)
    Uses GitHub API to commit file
    """
    
    if not GITHUB_TOKEN or not GITHUB_REPO:
        print("  ⚠️  GitHub credentials not configured - skipping push")
        print(f"     Set GITHUB_TOKEN and GITHUB_REPO environment variables")
        return
    
    print(f"  📤 Pushing to GitHub repo: {GITHUB_REPO}")
    print(f"     Branch: {GITHUB_BRANCH}")
    print(f"     File path: {DATA_FILE_PATH}")
    
    # GitHub API endpoint
    api_url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{DATA_FILE_PATH}"
    
    # Convert data to JSON
    json_content = json.dumps(data, indent=2, cls=DecimalEncoder)
    
    # Encode to base64 (GitHub API requirement)
    content_base64 = base64.b64encode(json_content.encode('utf-8')).decode('utf-8')
    
    # Check if file exists (to get SHA)
    file_sha = None
    try:
        print("  🔍 Checking if file exists...")
        
        # Create request to check file
        req = urllib.request.Request(
            f"{api_url}?ref={GITHUB_BRANCH}",
            headers={
                'Authorization': f'token {GITHUB_TOKEN}',
                'Accept': 'application/vnd.github.v3+json'
            }
        )
        
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                response_data = json.loads(response.read().decode('utf-8'))
                file_sha = response_data['sha']
                print(f"  ✓ File exists (SHA: {file_sha[:8]}...)")
    
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print("  ℹ️  File doesn't exist yet (will create)")
        else:
            print(f"  ⚠️  Error checking file: {e.code} {e.reason}")
    
    # Prepare commit payload
    payload = {
        'message': f'Update dashboard data - {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")} UTC',
        'content': content_base64,
        'branch': GITHUB_BRANCH
    }
    
    # Include SHA if updating existing file
    if file_sha:
        payload['sha'] = file_sha
    
    # Push to GitHub
    try:
        print("  📤 Pushing to GitHub...")
        
        req = urllib.request.Request(
            api_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Authorization': f'token {GITHUB_TOKEN}',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            method='PUT'
        )
        
        with urllib.request.urlopen(req) as response:
            if response.status in [200, 201]:
                print("  ✅ Successfully pushed to GitHub!")
                response_data = json.loads(response.read().decode('utf-8'))
                commit_sha = response_data['commit']['sha']
                commit_url = response_data['commit']['html_url']
                print(f"     Commit SHA: {commit_sha[:8]}...")
                print(f"     Commit URL: {commit_url}")
            else:
                print(f"  ❌ GitHub API error: {response.status}")
                raise Exception(f"GitHub API returned {response.status}")
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"  ❌ GitHub API error: {e.code} {e.reason}")
        print(f"     Response: {error_body}")
        raise Exception(f"GitHub API returned {e.code}: {error_body}")
    
    except Exception as e:
        print(f"  ❌ Failed to push to GitHub: {str(e)}")
        raise


class DecimalEncoder(json.JSONEncoder):
    """Helper to encode Decimal objects from DynamoDB"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)