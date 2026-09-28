import json
import boto3
import uuid
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Events')

def lambda_handler(event, context):
    http_method = event.get('httpMethod')
    
    if http_method == 'POST':
        body = json.loads(event['body'])
        event_id = str(uuid.uuid4())
        
        item = {
            'event_id': event_id,
            'name': body['name'],
            'capacity': int(body['capacity']),
            'going_count': 0,
            'waitlist_count': 0
        }
        
        table.put_item(Item=item)
        
        return {
            'statusCode': 201,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'event_id': event_id})
        }
        
    elif http_method == 'GET':
        response = table.scan()
        items = response.get('Items', [])
        
        for item in items:
            for key, value in item.items():
                if isinstance(value, Decimal):
                    item[key] = int(value)
                    
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(items)
        }