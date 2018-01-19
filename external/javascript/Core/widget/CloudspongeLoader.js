(function ($) {
    $(function () {
        $('a#contact_importer_button').click(function (e) {
            e.preventDefault();
            $(".bsd-contactImporter").ContactImporter({textareaId: $(this).attr('href').substr(1)});
        });
    });
})(window.bQuery || window.jQuery);
