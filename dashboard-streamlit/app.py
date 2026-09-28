import streamlit as st
import boto3
import pandas as pd
from boto3.dynamodb.conditions import Key

st.set_page_config(page_title="Enterprise RSVP Analytics", layout="wide")

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
events_table = dynamodb.Table('Events')
rsvps_table = dynamodb.Table('RSVPs')

def fetch_events():
    response = events_table.scan()
    return response.get('Items', [])

def fetch_rsvps(event_id):
    response = rsvps_table.query(
        KeyConditionExpression=Key('event_id').eq(event_id)
    )
    return response.get('Items', [])

st.sidebar.title("Dashboard Menu")
menu_option = st.sidebar.radio("Navigation", ["Overview", "Event Analytics", "Attendee Database"])

events = fetch_events()

if menu_option == "Overview":
    st.title("Global Event Overview")
    
    if events:
        df_events = pd.DataFrame(events)
        df_events['going_count'] = pd.to_numeric(df_events['going_count'])
        df_events['capacity'] = pd.to_numeric(df_events['capacity'])
        
        col1, col2, col3 = st.columns(3)
        col1.metric("Total Events", len(events))
        col2.metric("Total Capacity", df_events['capacity'].sum())
        col3.metric("Total Confirmed Attendees", df_events['going_count'].sum())
        
        st.subheader("Event Utilization")
        st.bar_chart(df_events.set_index('name')['going_count'])
    else:
        st.info("No events found in DynamoDB.")

elif menu_option == "Event Analytics":
    st.title("Detailed Event Analytics")
    
    if events:
        event_names = {e['name']: e['event_id'] for e in events}
        selected_event = st.selectbox("Select Event", list(event_names.keys()))
        event_id = event_names[selected_event]
        
        rsvps = fetch_rsvps(event_id)
        
        if rsvps:
            df_rsvps = pd.DataFrame(rsvps)
            status_counts = df_rsvps['status'].value_counts()
            
            c1, c2 = st.columns(2)
            with c1:
                st.write("### RSVP Distribution")
                st.bar_chart(status_counts)
            with c2:
                st.write("### Raw Data")
                st.dataframe(df_rsvps, use_container_width=True)
        else:
            st.warning("No RSVPs for this event yet.")

elif menu_option == "Attendee Database":
    st.title("Master Attendee Database")
    
    all_rsvps = rsvps_table.scan().get('Items', [])
    if all_rsvps:
        st.dataframe(pd.DataFrame(all_rsvps), use_container_width=True)
        
        csv = pd.DataFrame(all_rsvps).to_csv(index=False).encode('utf-8')
        st.download_button(
            label="Download CSV",
            data=csv,
            file_name='attendee_database.csv',
            mime='text/csv',
        )