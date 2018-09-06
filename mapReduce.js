function map(doc, meta) {
  if (doc._documentType !== 'operator-stats') return;
  emit(dateToArray(doc.createdAt).slice(0, 3).concat([doc.operatorId]), doc.action, doc.action)
}

function reduce(key, values, rereduce) {
  var actions = [
    'call',
    'call_answered',
    'meeting',
    'verified_owner',
    'schedule_call',
    'view_worksheet',
    'proposal_sent',
    'business_meeting'
  ];

  var totals = {};

  for(j = 0; j < actions.length; j++) {
    var action = actions[j];
    totals[action] = totals[action] || 0;
  }

  for(i = 0; i < values.length; i++) {
    if (rereduce) {
      for(j = 0; j < actions.length; j++) {
        var action = actions[j];
        totals[action] = totals[action] || 0;
        totals[action] += values[i][action]
      }
    } else {
      totals[values[i]] = totals[values[i]] || 0;
      totals[values[i]]++;
    }
  }

  if (totals.view_worksheet === 0) {
    totals.view_meeting_mean = 0;
  } else {
    totals.view_meeting_mean = totals.meeting / Math.max(1, totals.view_worksheet);
  }

  return totals;
}
