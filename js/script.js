$(document).ready(function(){
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
        }
    });

    $('#dropdownBeruf').change(function() {
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
            }
        });
    });


    $('#dropdownKlasse').change(function() {
        let classId = $(this).val();
        if(classId) {
            let view = calendar.getView();
            let weekNumber = moment(view.intervalStart).format('ww-YYYY');
            updateCalendarWithClassSchedule(classId, weekNumber);
        } else {
            $('#calendar').fullCalendar('removeEvents');
        }
    });

    let calendar = new FullCalendar.Calendar($('#calendar')[0], {
        initialView: 'dayGridWeek'
    });
    calendar.render();

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
                console.log(classId, data);
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
            },
            error: function() {
                alert('Es gab ein Problem beim Laden der Stundentafel.');
            }
        });
    }

});