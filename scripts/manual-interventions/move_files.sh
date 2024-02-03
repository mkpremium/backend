#!/bin/bash

# Check if the destination directory is provided
if [ -z "$1" ]
then
  echo "Please provide the destination directory as the first script argument."
  exit 1
fi

# Destination directory
dest_dir="$1"

# Read the file line by line
while IFS= read -r msgId
do
  # Check if the file exists
  if [ -f "messages_2024_02_03T16_28_20_events-migration-dlq/$msgId.json" ]
  then
    # Move the file to the destination directory
    mv "messages_2024_02_03T16_28_20_events-migration-dlq/$msgId.json" "$dest_dir"
  else
    # Log a message if the file doesn't exist
    echo "File messages_2024_02_03T16_28_20_events-migration-dlq/$msgId.json does not exist."
  fi
done < msgs_failed_scheduled_event.txt

