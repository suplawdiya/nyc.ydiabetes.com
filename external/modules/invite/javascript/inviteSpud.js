(function($){

$( document ).ready(function() {

    $('#invitationpage').onsubmit = function() {
        $('[name="submit_button"]')[0].disabled = true;
    };

    $.bsd.spud('populateShareForm', 'invitationpage',
    [
        'email',
        'firstname',
        'lastname'
    ]);

    var spudSent = false;
    $(document).ready(function() {
        $('#invitationpage').submit(function(e) {

            var guid = $.cookie('guid');
            if (typeof guid == 'string' && guid.length == 23) {
                $('#_guid').val(guid);
            }

            if (!spudSent) {
                $.bsd.spud('setFromShareForm', 'invitationpage',
                [
                    'email',
                    'firstname',
                    'lastname'
                 ], function () {
                     spudSent = true;
                     setTimeout(function() {$('#invitationpage').trigger('submit');}, 300);
                 });
                 e.preventDefault();
             }

        });
    });

});

})(window.bQuery || window.jQuery);