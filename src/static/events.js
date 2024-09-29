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
                <span><i class="bi bi-calendar-event me-1"></i>${event.summary}</span>
                <br>
                ${event.location ? `<span><i class="bi bi-geo-alt me-1"></i>${event.location}</span>` : ''}
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
    $(".event-card").each((i) => {
        console.log($(this));
        const startInput = $(this).find(".start-input");
        const endInput = $(this).find(".end-input");
        const untilInput = $(this).find(".until-input");

        console.log(startInput);

        const startValue = startInput.val();
        const endValue = endInput.val();
        const untilValue = untilInput.val();

        // Log the values for debugging
        console.log(i + ": Start: " + startValue);
        console.log(i + ": End: " + endValue);
        console.log(i + ": Until: " + untilValue);
    });

    return true;
}

export function parseEvents() {
    $(".event-card").each((i) => {
        console.log(this);
        const start_input = $(this).find(".start-input");
        const end_input = $(this).find(".end-input");
        const until_input = $(this).find(".until-input");

        const select_days = $(this).find(".select-days");
        const select_reminder = $(this).find(".select-reminder");

        console.log(start_input.val());
        console.log(end_input.val());
    });

}
