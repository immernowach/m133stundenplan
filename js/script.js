$(document).ready(function(){
    function setCalendarWeek(date) { // Aktuelle Kalenderwoche anzeigen
        let weekNumber = moment(date).week();
        $('#calendarWeek').text('Aktuelle Kalenderwoche: ' + weekNumber);
    }

    function setBerufdropdown(beruf_id) { // Berufe in das Dropdown laden
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
                
                if(beruf_id) { // Für den localStorage
                    dropdown.val(beruf_id);
                }
            },
            error: function() { // Error Handling
                alert('Es gab ein Problem beim Laden der Berufe.');
                console.log('Es gab ein Problem beim Laden der Berufe.');
            }
        });
    }

    function setKlassenDropdown(berufId, classId) {
        $.ajax({
            url: 'https://sandbox.gibm.ch/klassen.php?beruf_id=' + berufId,
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
                
                if (classId) {
                    dropdown.val(classId);
                }
            },
            error: function() {
                alert('Es gab ein Problem beim Laden der Klassen.');
                console.log('Es gab ein Problem beim Laden der Klassen.');
            }
        });
    }

    function updateCalendarWithClassSchedule(classId, weekNumber) { // Stundenplan in den Kalender laden
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
                $('#calendar').addClass('updated'); // Animation beim Laden des Stundenplans
                setTimeout(function() { // Animation beim Laden des Stundenplans wieder entfernen
                    $('#calendar').removeClass('updated');
                }, 2500);
            },
            error: function() { // Error Handling
                alert('Es gab ein Problem beim Laden des Stundenplans.');
                console.log('Es gab ein Problem beim Laden des Stundenplans.');
            }
        });
    }

    // Dropdowns

    $('#dropdownBeruf').change(function() { // auf Veränderung des Dropdowns "Beruf" reagieren
        let berufId = $(this).val();

        if(berufId) {
            localStorage.setItem('berufId', berufId);
            setKlassenDropdown(berufId);
        }
    });

    $('#dropdownKlasse').change(function() { // auf Veränderung des Dropdowns "Klasse" reagieren
        let classId = $(this).val();
        localStorage.setItem('classId', classId);

        if(classId) {
            let weekNumber = moment(calendar.view.currentStart).format('ww-YYYY');
            updateCalendarWithClassSchedule(classId, weekNumber);
        } else {
            calendar.removeAllEvents();
        }
    });

    // Kalender

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

    $('#close').on('click', function() { // Kalender Popup schliessen
        $('#eventDetails').hide();
    });

    $('#dayView').on('click', function() { // Kalenderansicht ändern
        calendar.changeView('dayGridDay');
    });

    $('#weekView').on('click', function() { // Kalenderansicht ändern
        calendar.changeView('dayGridWeek');
    });

    calendar.setOption('locale', 'de-ch'); // Sprache vom Kalender auf Deutsch setzen
    calendar.render();  // Kalender anzeigen
    setCalendarWeek(new Date()); // Aktuelle Kalenderwoche anzeigen

    // localStorage nutzen, um die zuletzt ausgewählten Elemente anzuzeigen

    let storedBerufId = localStorage.getItem('berufId');
    if (storedBerufId) {
        setBerufdropdown(storedBerufId);

        $('#dropdownBeruf').val(storedBerufId).trigger('change');
        $('#dropdownKlasse').prop('disabled', false);

        let storedClassId = localStorage.getItem('classId');
        if (storedClassId) {
            setKlassenDropdown(storedBerufId, storedClassId);
            updateCalendarWithClassSchedule(storedClassId, moment(calendar.view.currentStart).format('ww-YYYY'));
        }
    } else { // Wenn keine Daten im localStorage vorhanden sind, die Dropdowns mit Daten füllen
        setBerufdropdown();
    }
});