import { showAlert } from "./utils.js";

export function createEventNode(event) {
    let startTime = moment.parseZone(event.start, "YYYYMMDDTHHmmssZ");
    let endTime = moment.parseZone(event.end, "YYYYMMDDTHHmmssZ");

    if (endTime.isSame(startTime)) {
        endTime = endTime.add(1, 'hour');
    }

    // Header bg
    let bg;
    switch (event.type) {
        case "class":
            bg = "primary";
            break;
        case "homework":
            bg = "warning";
            break;
        case "quiz":
        case "exam":
            bg = "danger";
            break;
        default:
            bg = "secondary";
            break;
    }

    // Byday selector
    const daysOfWeek = [
        { code: "MO", name: "Monday" },
        { code: "TU", name: "Tuesday" },
        { code: "WE", name: "Wednesday" },
        { code: "TH", name: "Thursday" },
        { code: "FR", name: "Friday" },
        { code: "SA", name: "Saturday" },
        { code: "SU", name: "Sunday" },
    ];
    const eventByDay = event.byday || [];
    const dayOptions = daysOfWeek.map(day => {
        return `<option value="${day.code}" ${eventByDay.includes(day.code) ? "selected" : ""}>${day.name}</option>`;
    }).join("");

    const selectDays = `
        <select multiple class="form-select select-days" size="7">
            ${dayOptions}
        </select>
    `;

    // Reminder selector
    const reminderOptions = [
        { value: "0", label: "No Reminder" },
        { value: "5", label: "5 minutes before" },
        { value: "10", label: "10 minutes before" },
        { value: "15", label: "15 minutes before" },
        { value: "30", label: "30 minutes before" },
        { value: "60", label: "1 hour before" },
        { value: "120", label: "2 hours before" },
        { value: "1440", label: "1 day before" }, // 1440 minutes
        { value: "2880", label: "2 days before" }, // 2880 minutes
    ];
    const selectedReminderValue = "0";
    const selectReminder = `
        <select class="form-select select-reminder" size="1">
            ${reminderOptions.map(option => `
                <option value="${option.value}" ${option.value === selectedReminderValue ? "selected" : ""}>
                    ${option.label}
                </option>
            `).join("")}
        </select>
    `;

    return `
        <div class="card border-1 event-card">
            <div class="card-header bg-${bg} text-light">
                <small class="text-end">
                    ${event.type}
                </small>
                <br>
                <span class="event-name"><i class="bi bi-calendar-event me-1"></i>${event.summary}</span>
                <br>
                ${event.location ? `<span class="event-location"><i class="bi bi-geo-alt me-1"></i>${event.location}</span>` : ''}
            </div>
            <ul class="list-group list-group-flush">
                <li class="list-group-item">
                    <div class="d-flex justify-content-between">
                        <div class="row g-2 align-items-center">
                            <div class="col-auto">
                                <i class="bi bi-clock me-1"></i><b>Time:</b>
                            </div>
                            <div class="col-auto">
                                <input
                                    type="datetime-local"
                                    class="form-control start-input"
                                    id="meeting-time"
                                    name="meeting-time"
                                    value=${startTime.format('YYYY-MM-DDThh:mm')}
                                />
                            </div>
                            <div class="col-auto">
                                -
                            </div>
                            <div class="col-auto">
                                <input
                                    type="datetime-local"
                                    class="form-control end-input"
                                    id="meeting-time"
                                    name="meeting-time"
                                    value=${endTime.format('YYYY-MM-DDThh:mm')}
                                />
                            </div>
                        </div>
                    </div>
                </li>
                ${event.freq ? `
                    <li class="list-group-item">
                        <div class="row g-2 align-items-center">
                            <div class="col-auto">
                                <span><i class="bi bi-arrow-repeat me-1"></i><b>Frequency:</b> ${event.freq}
                            </div>
                            <div class="col-auto">
                                every 
                            </div>
                            <div class="col-auto">
                                ${selectDays}
                            </div>
                            <div class="col-auto">
                                until 
                            </div>
                            <div class="col-auto">
                                <input
                                    type="datetime-local"
                                    class="form-control until-input"
                                    id="meeting-time"
                                    name="meeting-time"
                                    value=${moment.parseZone(event.until, "YYYYMMDDTHHmmssZ").format('YYYY-MM-DDThh:mm')}
                                />
                            </div>
                        </div>
                    </li>` : ''
                }
                <li class="list-group-item">
                    <div class="row g-2 align-items-center">
                        <div class="col-auto">
                            <span><i class="bi bi-alarm me-1"></i><b>Remind me:</b>
                        </div>
                        <div class="col-auto">
                            ${selectReminder}
                        </div>
                        <div class="col-auto">
                            <input type="text" class="form-control reminder-msg" placeholder="Enter custom message" />
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    `;
}

export function validateEvents() {
    let isValid = true;
    $(".event-card").each(function(i) {
        if (!isValid)
            return;

        const card = $(this);
        
        const startInput = card.find(".start-input");
        const endInput = card.find(".end-input");
        const untilInput = card.find(".until-input");

        const startValue = startInput.val();
        const endValue = endInput.val();
        const untilValue = untilInput.val();

        const eventName = card.find(".event-name").text();

        // Validation logic
        if (!startValue && !endValue) {
            showAlert(`Event ${eventName}: Start or end times must be provided.`, "danger");
            isValid = false;
        } else {
            const startTime = moment(startValue);
            const endTime = moment(endValue);

            if (!startTime.isValid() || !endTime.isValid()) {
                showAlert(`Event ${eventName}: Please enter valid start and end times.`, "danger");
                isValid = false;
            } else if (endTime.isBefore(startTime)) {
                showAlert(`Event ${eventName}: End time must be after start time.`, "danger");

                isValid = false;
            }

            if (untilValue) {
                const untilTime = moment(untilValue);
                if (!untilTime.isValid() || untilTime.isBefore(startTime)) {
                    showAlert(`Event ${eventName}: "Until" time must be after the start time.`, "danger");
                    isValid = false; // Mark as invalid
                }
            }
        }
    });

    return isValid;
}

export function parseEvents(courseName) {
    var result = `BEGIN:VCALENDAR\nMETHOD:PUBLISH\nVERSION:2.0\n`;

    $(".event-card").each(function(i) {
        const card = $(this);
        
        const startInput = card.find(".start-input");
        const endInput = card.find(".end-input");
        const untilInput = card.find(".until-input");

        const startValue = startInput.val();
        const endValue = endInput.val();
        const untilValue = untilInput.val();

        const startTime = moment(startValue);
        const endTime = moment(endValue);
        const untilTime = moment(untilValue);

        const eventName = card.find(".event-name").text();

        result += "BEGIN:VEVENT\n";
        result += `SUMMARY:[${courseName}] - ${eventName}\n`;
        result += "PRIORITY:0\n";

        result += `DTSTART:${startValue ? startTime.format("YYYYMMDDTHHmmssZ") : ""}\n`;
        result += `DTEND:${endValue ? endTime.format("YYYYMMDDTHHmmssZ") : ""}\n`;

        if (false) {
            result += "RRULE:FREQ=WEEKLY;";

            const selectDays = $(card).find(".select-days").val();
            result += `BYDAY=${selectDays.join(",")};`;

            result += `UNTIL=${endValue ? untilTime.format("YYYYMMDDTHHmmssZ") : ""}`;

            result += "WKST=SU\n";
        }
        const eventLocation = card.find(".event-location").text();
        result += `LOCATION:${eventLocation}\n`;

        result += "END:VEVENT\n";
    });
    result += "END:VCALENDAR\n\n";

    return result;
}
