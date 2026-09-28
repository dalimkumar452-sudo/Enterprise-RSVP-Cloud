import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
rsvp_table = dynamodb.Table('RSVPs')
event_table = dynamodb.Table('Events')

def lambda_handler(event, context):
    body = json.loads(event['body'])
    event_id = body['event_id']
    user_id = body['user_id']
    status = body['status']
    
    event_response = event_table.get_item(Key={'event_id': event_id})
    if 'Item' not in event_response:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Event not found'})}
        
    event_data = event_response['Item']
    capacity = int(event_data['capacity'])
    current_going = int(event_data['going_count'])
    
    final_status = status
    if status == 'GOING':
        if current_going >= capacity:
            final_status = 'WAITLISTED'
            event_table.update_item(
                Key={'event_id': event_id},
                UpdateExpression="set waitlist_count = waitlist_count + :val",
                ExpressionAttributeValues={':val': 1}
            )
        else:
            event_table.update_item(
                Key={'event_id': event_id},
                UpdateExpression="set going_count = going_count + :val",
                ExpressionAttributeValues={':val': 1}
            )
            
    rsvp_table.put_item(
        Item={
            'event_id': event_id,
            'user_id': user_id,
            'status': final_status
        }
    )
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'status': final_status})
    }