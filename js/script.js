$(document).ready(function(){

    function setCalendarWeek(date) {
        let weekNumber = moment(date).week();
        $('#calendarWeek').text('Aktuelle Kalenderwoche: ' + weekNumber);
    }

    $.ajax({ 
        url: 'https://sandbox.gibm.ch/berufe.php',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            let dropdown = $('#dropdownBeruf');

            $.each(data, function (key, entry) {
                if(entry.beruf_name) {
                    dropdown.append($('<option></option>').attr('value', entry.beruf_id).text(entry.beruf_name));
                }
            })
        },
        error: function() {
            alert('Es gab ein Problem beim Laden der Berufe.');
            console.log('Es gab ein Problem beim Laden der Berufe.');
        }
    });

    $('#dropdownBeruf').change(function() { // TODO: local storage
        $.ajax({
            url: 'https://sandbox.gibm.ch/klassen.php?beruf_id=' + $(this).val(),
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                let dropdown = $('#dropdownKlasse');
                dropdown.empty();
                dropdown.append($('<option></option>').attr('value', '').text('Bitte wählen...')).prop('disabled', true);

                $.each(data, function (key, entry) {
                    if(entry.klasse_name) {
                        dropdown.append($('<option></option>').attr('value', entry.klasse_id).text(entry.klasse_name));
                        dropdown.prop('disabled', false);
                    }
                })
            },
            error: function() {
                alert('Es gab ein Problem beim Laden der Klassen.');
                console.log('Es gab ein Problem beim Laden der Klassen.');
            }
        });
    });

    $('#dropdownKlasse').change(function() { // TODO: local storage
        let classId = $(this).val();
        if(classId) {
            let weekNumber = moment(calendar.view.currentStart).format('ww-YYYY');
            updateCalendarWithClassSchedule(classId, weekNumber);
        } else {
            calendar.removeAllEvents();
        }
    });

    let calendar = new FullCalendar.Calendar($('#calendar')[0], {
        initialView: 'dayGridWeek',
        eventContent: function(arg) {
            let content = $('<div>').css('display', 'flex').css('justify-content', 'space-between');
            let timeDiv = $('<div>').text(arg.timeText);
            let titleDiv = $('<div>').addClass('title').text(arg.event.title);
            content.append(timeDiv, titleDiv);
            return { html: content.prop('outerHTML') };
        },
        eventClick: function(info) {
            let event = info.event;

            let startTime = event.start.getHours() + ':' + (event.start.getMinutes()<10?'0':'') + event.start.getMinutes();
            let endTime = event.end.getHours() + ':' + (event.end.getMinutes()<10?'0':'') + event.end.getMinutes();

            let details = `
                <h1>${event.title}</h1>
                <table class="table table-striped table-hover">
                    <tr><td>Start:</td><td>${startTime}</td></tr>
                    <tr><td>Ende:</td><td>${endTime}</td></tr>
                    <tr><td>Lehrer:</td><td>${event.extendedProps.lehrer}</td></tr>
                    <tr><td>Raum:</td><td>${event.extendedProps.raum}</td></tr>
                    <tr><td>Kommentar:</td><td>${event.extendedProps.kommentar}</td></tr>
                </table>
            `;
            $('#eventContent').html(details);
            $('#eventDetails').show();
        },
        datesSet: function(dateInfo) {
            let classId = $('#dropdownKlasse').val();
            if(classId) {
                let weekNumber = moment(dateInfo.start).format('ww-YYYY');
                updateCalendarWithClassSchedule(classId, weekNumber);
            }
        }
    });

    $('#close').on('click', function() {
        $('#eventDetails').hide();
    });

    $('#dayView').on('click', function() {
        calendar.changeView('dayGridDay');
    });

    $('#weekView').on('click', function() {
        calendar.changeView('dayGridWeek');
    });

    calendar.setOption('locale', 'de-ch');
    calendar.render();

    setCalendarWeek(new Date());

    function updateCalendarWithClassSchedule(classId, weekNumber) {
        $.ajax({
            url: 'https://sandbox.gibm.ch/tafel.php',
            method: 'GET',
            data: {
                klasse_id: classId,
                woche: weekNumber
            },
            dataType: 'json',
            success: function(data) {
                calendar.removeAllEvents();
                data.forEach(function(entry) {
                    calendar.addEvent({
                        title: entry.tafel_longfach,
                        start: entry.tafel_datum + 'T' + entry.tafel_von,
                        end: entry.tafel_datum + 'T' + entry.tafel_bis,
                        extendedProps: {
                            lehrer: entry.tafel_lehrer,
                            raum: entry.tafel_raum,
                            kommentar: entry.tafel_kommentar
                        }
                    });
                });
                $('#calendar').addClass('updated');
                setTimeout(function() {
                    $('#calendar').removeClass('updated');
                }, 2500);
            },
            error: function() {
                alert('Es gab ein Problem beim Laden des Stundenplans.');
                console.log('Es gab ein Problem beim Laden des Stundenplans.');
            }
        });
    }
});