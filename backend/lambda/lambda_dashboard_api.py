import json
import boto3
from datetime import datetime, timedelta
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('CostGuardianResourceLogs')

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    """
    API endpoint for CostGuardian dashboard
    
    Query parameters:
    - view: 'daily' | 'weekly' | 'monthly'
    - date: ISO date string (optional, defaults to today)
    """
    
    # Parse query parameters
    params = event.get('queryStringParameters', {}) or {}
    view = params.get('view', 'daily')
    date_str = params.get('date', datetime.now().isoformat())
    
    try:
        target_date = datetime.fromisoformat(date_str.split('T')[0])
    except:
        target_date = datetime.now()
    
    if view == 'daily':
        # DAILY VIEW: Return list of all deleted resources
        data = get_daily_deleted_resources(target_date)
        response_body = {
            'view': 'daily',
            'date': target_date.strftime('%Y-%m-%d'),
            'resources': data['resources'],
            'summary': data['summary']
        }
    
    elif view == 'weekly':
        # WEEKLY VIEW: Return counts by category for the week
        data = get_weekly_resource_counts(target_date)
        response_body = {
            'view': 'weekly',
            'week_start': data['week_start'],
            'week_end': data['week_end'],
            'categories': data['categories'],
            'daily_breakdown': data['daily_breakdown'],
            'summary': data['summary']
        }
    
    elif view == 'monthly':
        # MONTHLY VIEW: Return counts by category for the month
        data = get_monthly_resource_counts(target_date)
        response_body = {
            'view': 'monthly',
            'month': target_date.strftime('%Y-%m'),
            'categories': data['categories'],
            'weekly_breakdown': data['weekly_breakdown'],
            'summary': data['summary']
        }
    
    else:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid view parameter'})
        }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response_body, cls=DecimalEncoder)
    }


def get_daily_deleted_resources(target_date):
    """
    Get all resources deleted on a specific day
    Returns detailed list with resource info and savings
    """
    
    # Calculate timestamp range for the day
    start_of_day = int(datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0).timestamp())
    end_of_day = int(datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59).timestamp())
    
    # Scan DynamoDB for deleted resources
    resources = []
    total_monthly_savings = 0
    category_counts = {}
    
    try:
        response = table.scan(
            FilterExpression='#status = :deleted AND #ts BETWEEN :start AND :end',
            ExpressionAttributeNames={
                '#status': 'Status',
                '#ts': 'Timestamp'
            },
            ExpressionAttributeValues={
                ':deleted': 'DELETED',
                ':start': start_of_day,
                ':end': end_of_day
            }
        )
        
        items = response.get('Items', [])
        
        # Process each deleted resource
        for item in items:
            resource_type = item.get('ResourceType', 'Unknown')
            resource_id = item.get('ResourceId', 'N/A')
            resource_name = item.get('InstanceName') or item.get('VolumeName') or item.get('LoadBalancerName') or item.get('VpcName') or 'Unnamed'
            monthly_savings = float(item.get('EstimatedMonthlySavings', 0))
            deleted_date = datetime.fromtimestamp(float(item.get('Timestamp', 0)))
            
            # Add to list
            resources.append({
                'resource_type': resource_type,
                'resource_id': resource_id,
                'resource_name': resource_name,
                'monthly_savings': monthly_savings,
                'annual_savings': monthly_savings * 12,
                'deleted_at': deleted_date.isoformat(),
                'deleted_date_readable': deleted_date.strftime('%Y-%m-%d %H:%M:%S')
            })
            
            # Update totals
            total_monthly_savings += monthly_savings
            
            # Update category counts
            if resource_type not in category_counts:
                category_counts[resource_type] = 0
            category_counts[resource_type] += 1
    
    except Exception as e:
        print(f"Error querying DynamoDB: {str(e)}")
    
    # Sort by monthly savings (highest first)
    resources.sort(key=lambda x: x['monthly_savings'], reverse=True)
    
    return {
        'resources': resources,
        'summary': {
            'total_resources_deleted': len(resources),
            'total_monthly_savings': total_monthly_savings,
            'total_annual_savings': total_monthly_savings * 12,
            'categories': category_counts
        }
    }


def get_weekly_resource_counts(target_date):
    """
    Get resource deletion counts for the week containing target_date
    Returns counts by category and daily breakdown
    """
    
    # Calculate week start (Monday) and end (Sunday)
    week_start = target_date - timedelta(days=target_date.weekday())
    week_start = datetime(week_start.year, week_start.month, week_start.day, 0, 0, 0)
    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)
    
    start_timestamp = int(week_start.timestamp())
    end_timestamp = int(week_end.timestamp())
    
    # Query DynamoDB
    categories = {}
    daily_breakdown = {i: {} for i in range(7)}  # Monday=0, Sunday=6
    total_monthly_savings = 0
    
    try:
        response = table.scan(
            FilterExpression='#status = :deleted AND #ts BETWEEN :start AND :end',
            ExpressionAttributeNames={
                '#status': 'Status',
                '#ts': 'Timestamp'
            },
            ExpressionAttributeValues={
                ':deleted': 'DELETED',
                ':start': start_timestamp,
                ':end': end_timestamp
            }
        )
        
        items = response.get('Items', [])
        
        for item in items:
            resource_type = item.get('ResourceType', 'Unknown')
            timestamp = float(item.get('Timestamp', 0))
            monthly_savings = float(item.get('EstimatedMonthlySavings', 0))
            
            # Update category counts
            if resource_type not in categories:
                categories[resource_type] = {
                    'count': 0,
                    'monthly_savings': 0
                }
            
            categories[resource_type]['count'] += 1
            categories[resource_type]['monthly_savings'] += monthly_savings
            
            total_monthly_savings += monthly_savings
            
            # Update daily breakdown
            deleted_date = datetime.fromtimestamp(timestamp)
            day_of_week = deleted_date.weekday()
            
            if resource_type not in daily_breakdown[day_of_week]:
                daily_breakdown[day_of_week][resource_type] = 0
            daily_breakdown[day_of_week][resource_type] += 1
    
    except Exception as e:
        print(f"Error querying DynamoDB: {str(e)}")
    
    # Format daily breakdown
    daily_formatted = []
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    for day_index in range(7):
        day_date = week_start + timedelta(days=day_index)
        daily_formatted.append({
            'day': day_names[day_index],
            'date': day_date.strftime('%Y-%m-%d'),
            'categories': daily_breakdown[day_index]
        })
    
    return {
        'week_start': week_start.strftime('%Y-%m-%d'),
        'week_end': week_end.strftime('%Y-%m-%d'),
        'categories': categories,
        'daily_breakdown': daily_formatted,
        'summary': {
            'total_resources_deleted': sum(cat['count'] for cat in categories.values()),
            'total_monthly_savings': total_monthly_savings,
            'total_annual_savings': total_monthly_savings * 12
        }
    }


def get_monthly_resource_counts(target_date):
    """
    Get resource deletion counts for the month
    Returns counts by category and weekly breakdown
    """
    
    # Calculate month start and end
    month_start = datetime(target_date.year, target_date.month, 1, 0, 0, 0)
    
    # Calculate last day of month
    if target_date.month == 12:
        next_month = datetime(target_date.year + 1, 1, 1)
    else:
        next_month = datetime(target_date.year, target_date.month + 1, 1)
    
    month_end = next_month - timedelta(seconds=1)
    
    start_timestamp = int(month_start.timestamp())
    end_timestamp = int(month_end.timestamp())
    
    # Query DynamoDB
    categories = {}
    weekly_breakdown = []
    total_monthly_savings = 0
    
    try:
        response = table.scan(
            FilterExpression='#status = :deleted AND #ts BETWEEN :start AND :end',
            ExpressionAttributeNames={
                '#status': 'Status',
                '#ts': 'Timestamp'
            },
            ExpressionAttributeValues={
                ':deleted': 'DELETED',
                ':start': start_timestamp,
                ':end': end_timestamp
            }
        )
        
        items = response.get('Items', [])
        
        # Calculate weeks in month
        current_week_start = month_start
        week_data = {}
        
        while current_week_start < month_end:
            current_week_end = min(current_week_start + timedelta(days=6, hours=23, minutes=59, seconds=59), month_end)
            week_key = current_week_start.strftime('%Y-W%U')
            week_data[week_key] = {
                'start': current_week_start,
                'end': current_week_end,
                'categories': {}
            }
            current_week_start += timedelta(days=7)
        
        # Process items
        for item in items:
            resource_type = item.get('ResourceType', 'Unknown')
            timestamp = float(item.get('Timestamp', 0))
            monthly_savings = float(item.get('EstimatedMonthlySavings', 0))
            
            # Update category counts
            if resource_type not in categories:
                categories[resource_type] = {
                    'count': 0,
                    'monthly_savings': 0
                }
            
            categories[resource_type]['count'] += 1
            categories[resource_type]['monthly_savings'] += monthly_savings
            
            total_monthly_savings += monthly_savings
            
            # Update weekly breakdown
            deleted_date = datetime.fromtimestamp(timestamp)
            week_key = deleted_date.strftime('%Y-W%U')
            
            if week_key in week_data:
                if resource_type not in week_data[week_key]['categories']:
                    week_data[week_key]['categories'][resource_type] = 0
                week_data[week_key]['categories'][resource_type] += 1
        
        # Format weekly breakdown
        for week_key, week_info in sorted(week_data.items()):
            weekly_breakdown.append({
                'week': week_key,
                'start_date': week_info['start'].strftime('%Y-%m-%d'),
                'end_date': week_info['end'].strftime('%Y-%m-%d'),
                'categories': week_info['categories']
            })
    
    except Exception as e:
        print(f"Error querying DynamoDB: {str(e)}")
    
    return {
        'month': target_date.strftime('%Y-%m'),
        'categories': categories,
        'weekly_breakdown': weekly_breakdown,
        'summary': {
            'total_resources_deleted': sum(cat['count'] for cat in categories.values()),
            'total_monthly_savings': total_monthly_savings,
            'total_annual_savings': total_monthly_savings * 12
        }
    }