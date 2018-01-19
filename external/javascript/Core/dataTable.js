(function($) {
$.widget("ui.BlueDataTable", $.extend({}, $.ui.getVar, {

   _create:function(){
        this.options = this._getJsonVar("tableConfigJson");
        this.renderTable();
    },
    renderTable:function(){
        if(!this.options.dataUrl && !this.options.jsonDataSource){
            tableConfig = {
                 'aaSortingFixed': this.options.sortDef,
                 'aoColumns': this.options.columnDef,
                 'bAutoWidth' : false,
                 'bFilter': this.options.bFilter,
                 'bInfo': false,
                 'bJQueryUI': true,
                 'bLengthChange': false,
                 'iDisplayLength': this.options.recordsPerPage,
                 'oLanguage': { 'sSearch': 'Filter:'},
                 'sPaginationType': 'no_buttons'
            };

        } else if(this.options.jsonDataSource){
            tableConfig = {
                 'aaSorting': this.options.sortDef,
                 'aoColumns': this.options.columnDef,
                 'bAutoWidth' : false,
                 'bFilter': this.options.bFilter,
                 'bInfo': true,
                 'bJQueryUI': true,
                 'bLengthChange': false,
                 'bProcessing': false,
                 'iDisplayLength': this.options.recordsPerPage,
                 'oLanguage': { 'sSearch': 'Search:'},
                 'sPaginationType': 'no_buttons',
                 'sDom': '<"toolbar"<"info"<"tableHeader">i>f>rtp'
            };

        } else if(this.options.infiniteScrolling){
            this.oCache = new Array;
            this.oCache[this.element.context.id] = {"iCacheLower":-1};
            tableConfig = {
                 'aaSorting': this.options.sortDef ? this.options.sortDef : [[0, 'asc']],
                 'aoColumnDefs': this.options.columnDef,

                 'bAutoWidth' : false,
                 'bDeferRender': true,
                 'bFilter': this.options.bFilter,
                 'bInfo': true,
                 'bJQueryUI': true,
                 'bProcessing': true,
                 'bScrollCollapse': true,
                 'bServerSide': true,

                 'oLanguage': { 'sSearch': 'Filter saved searches:'},
                 'oScroller': {'loadingIndicator': this.options.loadingIndicator, 'displayBuffer': 3},

                 'sAjaxSource': this.options.dataUrl,
                 'sDom': '<"toolbar"<"info"<"tableHeader"><"infoMessage"ir>>f>tS',
                 'sScrollY': '300px',
                 'sScrollX': '',

                 // functions
                 'fnDrawCallback': $.proxy(this.fnAfterDraw, this),
                 'fnInitComplete': $.proxy(this.fnAfterInit, this),
                 'fnFooterCallback': $.proxy(this.fnFooterUpdate, this),
                 'fnHeaderCallback': $.proxy(this.fnHeaderUpdate, this),
                 'fnServerData': $.proxy(this.dataTablesPipelineDuringRest, this)

            };
        } else{

            this.oCache = new Array;
            this.oCache[this.element.context.id] = {"iCacheLower":-1};
            tableConfig = {
                 'aaSorting': this.options.sortDef ? this.options.sortDef : [[0, 'asc']],
                 'aoColumnDefs': this.options.columnDef,

                 'bAutoWidth' : false,
                 'bFilter': this.options.bFilter,
                 'bInfo': true,
                 'bJQueryUI': true,
                 'bLengthChange': false,
                 'bProcessing': true,
                 'bServerSide': true,

                 'iDisplayLength': this.options.recordsPerPage,

                 'sPaginationType': 'input',
                 'sAjaxSource': this.options.dataUrl,
                 'sDom': '<"toolbar"<"info"<"tableHeader">r>f>tp',

                 'oLanguage': { 'sSearch': 'Filter:'},

                 // functions
                 'fnDrawCallback': $.proxy(this.fnAfterDraw, this),
                 'fnFooterCallback': $.proxy(this.fnFooterUpdate, this),
                 'fnHeaderCallback': $.proxy(this.fnHeaderUpdate, this),
                 'fnInitComplete': $.proxy(this.fnAfterInit, this),
                 'fnServerData': $.proxy(this.dataTablesPipelineDuringRest, this)
            };
        }

        this.iPipe.size = this.options.pipeSize;

        //make the datatable
        this.dataTable = this.element.find('table').dataTable(tableConfig);

        //setup header
        if(this.options.tableHeader)
            this.element.find('.tableHeader').html(this.options.tableHeader);

        //sorting by header element
        this.element.find('th').click($.proxy(function(event){
            if (this.element.find('th').hasClass('dataTables_sortableCol')) {
                this.element.find('th').removeClass('bsd-sorted-column');
            }
            if ($(event.currentTarget).hasClass('dataTables_sortableCol')) {
                $(event.currentTarget).addClass('bsd-sorted-column');
            }
        }, this));

        this.element.show();

        // formatting for after visibility
        if (!this.element.parents('.bsd-modal, .bsd-tabPanel').length) {
            $('table:first', this.element).OptimalWidthTable();
            var tableWidth = $('table:first', this.element).OptimalWidthTable('getWidth');
            if(tableWidth > 0){
                $('.bsd-manage-header-inner h1').width(tableWidth);
                this.element.prev().width(tableWidth);
            }

            if ($('#outer-wrap').length && tableWidth > this.element.width()) {
                $('#outer-wrap').css('overflow', 'visible');
            }
        }else{
            this.element.parents('.bsd-modal').on('dialogcreate', $.proxy(this.fnAfterInit, this));
            this.element.parents('.bsd-modal').on('dialogopen', $.proxy(this.fnAfterInit, this));
            this.element.parents('.bsd-modal').on('dialogresize', $.proxy(this.fnAfterInit, this));
            this.element.parents('.bsd-modal').on('dialogclose', $.proxy(this.resetFilters, this));

            this.element.parents('.bsd-tabPanel').on('show', $.proxy(this.fnAfterInit, this));
        }
    },

    fnAfterDraw: function(){
        //setup any callbacks we may have
        if(this.options.callBacks && this.options.callBacks.length > 0){
            for(i = 0; i < this.options.callBacks.length; i++){
                eval(this.options.callBacks[i]);
            }
        }

        //hide the scroller's loading box when the table is to short to hold
        if(this.dataTable && this.dataTable.fnSettings().oScroller){
            if(this.dataTable.fnSettings()._iRecordsDisplay < 2){
                this.element.parent().find('.DTS_Loading').hide();
            }else{
                this.element.parent().find('.DTS_Loading').show();
            }
        }

    },

    fnAfterInit: function(){
        if(this.dataTable){
            this.dataTable.fnAdjustColumnSizing();

            if(this.dataTable.fnSettings().oScroller){
                this.dataTable.fnSettings().oScroller.fnMeasure(true);
            }
        }
    },

    fnFooterUpdate: function(nFoot, aasData, iStart, iEnd, aiDisplay){
        if(this.dataTable && iStart == 0 && iEnd == this.dataTable.fnSettings()._iRecordsTotal){
            this.element.parent().find('#'+this.dataTable.context.id+ ' .dataTables_paginate').hide();
        }else{
            this.element.parent().find('#'+this.dataTable.context.id+ ' .dataTables_paginate').show();
        }
    },

    fnHeaderUpdate: function(nHead, aasData, iStart, iEnd, aiDisplay){
        if(this.dataTable && !this.options.infiniteScrolling && this.dataTable.fnSettings()._iRecordsTotal == 0){
            this.element.parent().find('.dataTables_info').remove();
        }
    },

    fnSetKey: function( aoData, sKey, mValue ){
            for ( var i=0, iLen=aoData.length ; i<iLen ; i++ )
            {
                if ( aoData[i].name == sKey )
                {
                    aoData[i].value = mValue;
                }
            }
    },

    fnGetKey: function( aoData, sKey ){
        for ( var i=0, iLen=aoData.length ; i<iLen ; i++ )
        {
            if ( aoData[i].name == sKey )
            {
                return aoData[i].value;
            }
        }
        return null;
    },

    resetFilters: function(){
        var oSettings = this.dataTable.fnSettings();
        for(iCol = 0; iCol < oSettings.aoPreSearchCols.length; iCol++) {
            oSettings.aoPreSearchCols[ iCol ].sSearch = '';
        }
        oSettings.oPreviousSearch.sSearch = '';
        this.dataTable.fnDraw();
        jQuery('.dataTables_filter input').val('').keyup();
    },

    refreshData: function() {
        lastPipe = this.element.data("lastPipeLine");
        this.fnDataTablesPipeline(lastPipe.source, lastPipe.data, lastPipe.callback, true);
    },

    dataTablesPipelineDuringRest: function(source, data, callback) {
        if(this.pipelineTimeout) {
            window.clearTimeout(this.pipelineTimeout);
        }

        this.pipelineTimeout = window.setTimeout(this._makeCallback(this.fnDataTablesPipeline, this, source, data, callback), 230);
    },
    _makeCallback:function(func, obj) {
        var args=$.makeArray($(arguments).slice(2));

        return function() {
            func.apply(obj, args);
        }
    },
    fnDataTablesPipeline: function( sSource, aoData, fnCallback, forceRefresh ) {
        this.element.data("lastPipeLine", {source:sSource, data:aoData, callback:fnCallback});

        var iPipe = this.iPipe.size;

        var sEcho = this.fnGetKey(aoData, "sEcho");
        var iRequestStart = this.fnGetKey(aoData, "iDisplayStart");
        var iRequestLength = this.fnGetKey(aoData, "iDisplayLength");
        var iRequestEnd = iRequestStart + iRequestLength;

        this.oCache[this.element.context.id].iDisplayStart = iRequestStart;

        var bNeedServer = forceRefresh ? forceRefresh : this.shouldUpdateFromServer(aoData);

        /* Store the request for checking next time around */
        this.oCache[this.element.context.id].lastRequest = aoData.slice();
        json = $.extend(true, {}, this.oCache[this.element.context.id].lastJson);
        if ( bNeedServer || !json.aaData)
        {
            if ( iRequestStart < this.oCache[this.element.context.id].iCacheLower )
            {
                iRequestStart = iRequestStart - (iRequestLength*(iPipe-1));
                if ( iRequestStart < 0 )
                {
                    iRequestStart = 0;
                }
            }

            this.oCache[this.element.context.id].iCacheLower = iRequestStart;
            this.oCache[this.element.context.id].iCacheUpper = iRequestStart + (iRequestLength * iPipe);
            this.oCache[this.element.context.id].iDisplayLength = this.fnGetKey( aoData, "iDisplayLength" );
            this.fnSetKey( aoData, "iDisplayStart", iRequestStart );
            this.fnSetKey( aoData, "iDisplayLength", iRequestLength*iPipe );

            if(this.options.allowCustomParams){
                this.appendCustomParams(aoData);
            }

            var destUrl = sSource;
            if (this.options.appendGetParams) {
                var getParams = this.getGetParams();
                if (getParams) {
                    destUrl += "?" + getParams;
                }
            }

            $.getJSON( destUrl, aoData,

                $.proxy(function (json) {

                /* Callback processing */
                this.oCache[this.element.context.id].lastJson = $.extend(true, {}, json);

                if ( this.oCache[this.element.context.id].iCacheLower != this.oCache[this.element.context.id].iDisplayStart )
                {
                    json.aaData.splice( 0, this.oCache[this.element.context.id].iDisplayStart-this.oCache[this.element.context.id].iCacheLower );
                }
                json.aaData.splice( this.oCache[this.element.context.id].iDisplayLength, json.aaData.length );

                fnCallback(json);
            }, this) );
        }
        else
        {
            json.sEcho = sEcho; /* Update the echo for each response */
            json.aaData.splice( 0, iRequestStart-this.oCache[this.element.context.id].iCacheLower );
            json.aaData.splice( iRequestLength, json.aaData.length );
            fnCallback(json);
            return;
        }


    },
    getGetParams:function() {
        var queryStringStart = window.location.href.indexOf('?');
        var anchorStart = window.location.href.indexOf('#');
        var getParams = '';
        if (queryStringStart != -1) {
            if (anchorStart != -1) {
                getParams = window.location.href.slice(queryStringStart + 1, anchorStart);
            } else {
                getParams = window.location.href.slice(queryStringStart + 1);
            }
        }
        return getParams;
    },

    appendCustomParams:function(aoData) {
        if( this.options.allowCustomParams && this.options.customParams.length > 0){
            for( var i=0, iLen=this.options.customParams.length ; i<iLen ; i++ ){
                aoData.push(
                        {'name': this.options.customParams[i],
                         'value' : jQuery('.'+this.options.customParams[i]).attr('value')});
            }
        }
        return aoData;
    },

    shouldUpdateFromServer:function(aoData){
        var iRequestStart = this.fnGetKey(aoData, "iDisplayStart");
        var iRequestLength = this.fnGetKey(aoData, "iDisplayLength");
        var iRequestEnd = iRequestStart + iRequestLength;
        /* outside pipeline? */
        if ( this.oCache[this.element.context.id].iCacheLower < 0
        || iRequestStart < this.oCache[this.element.context.id].iCacheLower
        || iRequestEnd > this.oCache[this.element.context.id].iCacheUpper
        )
        {
            return true;
        }

        /* sorting etc changed? */
        if ( this.oCache[this.element.context.id].lastRequest)
        {
            for( var i=0, iLen=aoData.length ; i<iLen ; i++ )
            {
                if ( aoData[i].name != "iDisplayStart" && aoData[i].name != "iDisplayLength" && aoData[i].name != "sEcho" )
                {
                    if ( aoData[i].value != this.oCache[this.element.context.id].lastRequest[i].value )
                    {
                        return true;
                    }
                }
            }
        }

    },

    /* Ajust the pipe size */
    iPipe: {

    },

    oCache: {

    },
    getDataTable: function() {
        return this.dataTable;
    }

}));
$.ui.BlueDataTable.loadAll = function(){
    $(".bsd-datatable").BlueDataTable();
}

$.ui.BlueDataTable.getDataTables = function(){
    return jQuery.fn.dataTable.fnTables(true);
}


})(window.bQuery || window.jQuery);
