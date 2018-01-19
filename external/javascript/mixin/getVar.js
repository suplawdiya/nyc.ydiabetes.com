(function()
{
    getVar = function($){
        return {
            _getVar:function(name){
                return this.element.find("." + name).val();
            },
            _getJsonVar:function(name){
                var item=this._getVar(name);

                if ($ && $.parseJSON) {
                    return $.parseJSON(item);
                } else {
                    return {};
                }
            },
            _setVar:function(name, value){
                var e = this.element.find("." + name);

                if (e.length == 0){
                    e = $('<input type="hidden" />').addClass(name).appendTo(this.element);
                }

                e.val(value);
            },
            _setJsonVar:function(name, obj){
                this._setVar(name, $.toJSON(obj));
            }
        };
    };

    if (window.jQuery && window.jQuery.ui)
    {
        window.jQuery.ui.getVar = getVar(window.jQuery);
    }

    if (window.bQuery && window.bQuery.ui)
    {
        window.bQuery.ui.getVar = getVar(window.bQuery);
    }
})();
