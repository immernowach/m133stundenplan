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
        let selectedBerufId = $(this).val();
        console.log('Ausgewählter Beruf ID: ' + selectedBerufId);
    });

});