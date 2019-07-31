import {ScheduledEventsRepository} from '../scheduled-events/models';

export async function updateProposalsOnScheduleEventsBuilding(proposal, building) {
  const scheduleEventsRepository = new ScheduledEventsRepository();
  const meetings = await scheduleEventsRepository.findAllMeetingsByBuildingId(building.id);

  await Promise.all(meetings.map(async(meeting) => {
    const meetingToUpdate = JSON.parse(JSON.stringify(meeting));

    meetingToUpdate.event.owner.building.proposals =
      meetingToUpdate.event.owner.building.proposals.concat([proposal.id]);

    meetingToUpdate.event.owner.building.recentProposal = proposal;

    const updatedMeeting = await scheduleEventsRepository.save(meetingToUpdate, false);
    return scheduleEventsRepository.firebaseMeeting(updatedMeeting);
  }));
}
