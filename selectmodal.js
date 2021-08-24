/*
--------------------#
Plugin SelectModal
- by lfac 2021-08-24
--------------------#
*/

"use strict";

(function ( $ ) {

    $.fn.selectmodal = function(options)
    {

        var settings = $.extend({
        }, options );

        return this.each(function(i,v){
            var $sel = $(this);
            if(options=='set-value')
            {
                var $cnt = $sel.next();
                $cnt.find('.cl-key').val($sel.val());
                $cnt.find('.cl-value').val($sel.find('option:selected').text());
            }
            else if(options=='refresh')
            {
                $sel.selectmodal('set-value');

                var $cnt = $sel.next();
                $sel.data('database').transaction(function(tra){
                    tra.executeSql("DROP TABLE SelMdlItens");
                });
                var xstr = "";
                var str = "";
                var ystr = "";
                for(var i=1;i<=$sel.data('colunas');i++)
                {
                    xstr+=",c"+i+" TEXT ";
                    str+=",c"+i+" ";
                    ystr+=",?";
                }
                var xvals = [];
                $.each($sel.children('option'),function(i,v){
                    var vals = [$(v).attr('value')];
                    for(var i=1;i<=$sel.data('colunas');i++)
                        vals.push($(v).data('coluna_'+i));
                    xvals.push(vals);
                });
            
                $sel.data('database').transaction(function(tra){
                    tra.executeSql("CREATE TABLE IF NOT EXISTS SelMdlItens (id TEXT UNIQUE"+xstr+")");
                    $.each(xvals,function(i,v){
                        tra.executeSql("INSERT INTO SelMdlItens (id"+str+") VALUES (? "+ystr+")",v);
                    });
                });
            }
            else if(options=='open')
            {
                var $cnt = $sel.next();
                var cnt ='<div class="modal md-mensagem" tabindex="-1" role="dialog">'+
                '<div class="modal-dialog modal-lg" role="document"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">'+$sel.data('titulo')+'</h5><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div><div class="modal-body"><div class="mdl-respo_cnt" style="max-height:480px; overflow:auto;"></div></div><div class="modal-footer"><button type="button" class="selecionar btn btn-outline-primary"><i class="fas fa-check fa-fw"></i> Selecionar</button><button type="button" class="btn btn-outline-secondary" data-dismiss="modal"><i class="fas fa-times fa-fw"></i> Cancelar</button></div></div></div></div>';
                var $mdl = $(cnt);
                $('body').prepend($mdl);
                var $filter = $('<input type="text" class="form-control mb-3" placeholder="Filtrar..." />');
                $mdl.find('.modal-body').prepend($filter);
                $filter.on('keyup',function(i,v){
                    $mdl.find('.mdl-respo_cnt').find('tbody').html('<tr><td colspan="'+(parseInt($sel.data('colunas'))+2)+'"><div class="alert alert-warning" role="alert">Filtrando, por favor aguarde...</div></td></tr>');
                    $sel.data('database').transaction(function(tra){
                        var lkx = "'%"+$filter.val().replaceAll("'","''")+"%'";
                        var lsx = "";
                        for(var i=1;i<=parseInt($sel.data('colunas'));i++)
                            lsx+=" OR c"+i+" LIKE "+lkx;
                        var strSQL = "SELECT * FROM SelMdlItens WHERE id LIKE "+lkx+lsx;
                        tra.executeSql(strSQL,[],function(t,r){
                            $mdl.find('.mdl-respo_cnt').find('tbody').html('');
                            if(r.rows.length>0)
                            {
                                $.each(r.rows,function(i,v){
                                    var content = '<tr data-id="'+v.id+'">';
                                    content+= '<td><input name="RdSelMdl" type="radio" class="inp-rd" value="'+v.id+'" /></td>';
                                    if(v.id!='')
                                    {
                                        $.each(v,function(ii,vv){
                                            vv = vv!==undefined?vv:'';
                                            if(ii!='id') content+= '<td style="white-space:nowrap;">'+vv+'</td>';
                                        });
                                    }
                                    else content+= '<td colspan="'+(parseInt($sel.data('colunas'))+1)+'">Indefinido</td>';
                                    
                                    content+= '</tr>';
                                    var $cnt = $(content);
                                    $cnt.click(function(){
                                        $(this).find('.inp-rd').prop('checked',true);
                                    });
                                    if(v.id==$sel.val()) $cnt.click();
                                    $mdl.find('.mdl-respo_cnt').find('tbody').append($cnt);
                                });
                            }
                            else
                            {
                                $mdl.find('.mdl-respo_cnt').find('tbody').html('<tr><td colspan="'+(parseInt($sel.data('colunas'))+2)+'"><div class="alert alert-warning" role="alert">Nenhum registro encontrado.</div></td></tr>');
                            }
                        });
                    })
                }).change();
                $mdl.find('.selecionar').click(function(){
                    $sel.val($mdl.find('.mdl-respo_cnt').find('tbody').find('.inp-rd:checked').val());
                    $sel.selectmodal('refresh');
                    $mdl.modal('hide');
                });
                
                $mdl.on('hidden.bs.modal',function(){
                    $mdl.remove();
                }).on('shown.bs.modal',function(){
                    $filter.focus().keyup();
                }).modal('show');

                var tabela = '<table class="table table-bordered">';
                tabela+='<thead><tr>';
                tabela+='<th></th>';
                if(typeof $sel.data('cabecalho') === 'object')
                {
                    $.each($sel.data('cabecalho'),function(i,v){
                        tabela+='<th style="white-space:nowrap;">'+v+'</th>';
                    }); 
                }
                tabela+='</tr><thead>';   
                tabela+='<tbody></tbody>';
                tabela+='</table>';
                $mdl.find('.mdl-respo_cnt').append(tabela);
            }
            else
            {
                var $cnt = $('<div class="selectmodal-cnt d-flex flew-row"></div>');
                $cnt.insertAfter($sel);
                $cnt.append('<input type="text" class="form-control cl-key" value="" style="width:80px;" disabled />');
                $cnt.append('<input type="text" class="form-control cl-value" value="" style="width:240px;" disabled />');
                var $btn = $('<button type="button" class="btn btn-outline-secondary"><i class="fas fa-search fa-fw"></i></btn>');
                $btn.click(function(){
                    $sel.selectmodal('open');
                });
                $cnt.append($btn);
                $sel.data('database',openDatabase("SelMdl","1.0","",64*1024*1024));
                $sel.addClass('d-none');
                $sel.selectmodal('refresh');
            }
        });
    }
}( jQuery ));