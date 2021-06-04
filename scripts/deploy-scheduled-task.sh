#!/usr/bin/env sh

taskname=${1}
taskrevision=${2}
rulename=${3}

eventsrule=$(aws events list-targets-by-rule --rule "${rulename}")
echo "eventsrule: ${eventsrule}"

taskdefinitionarn=$(aws events list-targets-by-rule --rule "${rulename}" | egrep "TaskDefinitionArn" | tr "/" " " | awk '{print $2}' | tr -d '"')
echo "taskdefinitionarn: ${taskdefinitionarn}"

eventsRole=$(aws events list-targets-by-rule --rule "${rulename}" | egrep "RoleArn" | tr "/" " " | awk '{print $2}')
roleArn="${eventsRole:1}/ecs-events-role"
echo "roleArn: ${roleArn}"

newtaskdefinitionarn="${taskdefinitionarn}/${taskname}:${taskrevision}"
echo "newtaskdefinitionarn: ${newtaskdefinitionarn}"

echo "${eventsrule}" | jq '.Targets[0].EcsParameters.TaskDefinitionArn='\"${newtaskdefinitionarn}\" | jq '.Targets[0].RoleArn='\"${roleArn}\" > tempEvents.json

aws events put-targets --rule "${rulename}" --cli-input-json file://tempEvents.json

