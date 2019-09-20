import Vue from '../../lib/vue/vue.min';
import _ from 'lodash';
import cheerio from 'cheerio';

const editCode = (code) => {
    const $ = cheerio.load(code);

    const takeOffIds = [];
    
    const valRegexp = /\<span(.*?)\<\/span>/g;
    const matches = code.match(valRegexp);

    for(let i = 0; i < matches.length; i++){
        const line = matches[i];

        if(line === '<span class="pln">takeoff</span>'){
            takeOffIds.push(i + 2);
        }
    }

    for(let j = 0; j < takeOffIds.length; j++){
        $(`span`).eq(takeOffIds[j]).addClass('d-none').after(`<input maxLength="3" type="tel" id="field_takeoff_${j}" class="field" style="width:27px" value="${$(`span`).eq(takeOffIds[j]).text()}" />`);
    }

    return {
        html: $.html(),
        fields: {
            takeoff: takeOffIds.length
        }
    };
}

let codeVue;

const init = (el, workspace) => {
    codeVue = new Vue({
        el,
        template: `
            <div class="code-view-wrapper">
                <a href="#" v-if="!editMode" v-on:click="edit">Edit</a>
                <a href="#" v-if="editMode" v-on:click="save">Save</a>
                <pre class="code-view prettyprint linenums prettyprinted" v-html="code"></pre>
            </div>
        `,
        data: {
            code: '',
            editMode: false,
            fields: {}
        },
        methods: {
            addCode: function(code){
                this.code = PR.prettyPrintOne(code);
            },
            edit: function(){
                const {fields, html} = editCode(this.code);
                
                this.editMode = true;
                this.code = html;

                setTimeout(() => {
                    for(let key in fields){
                        _.each(Array(fields[key]), (v, i) => {
                            if(document.querySelector(`#field_${key}_${i}`)){
                                document.querySelector(`#field_${key}_${i}`).addEventListener('change', ({target}) => {
                                    this.fields[`field_${key}_${i}`] = target.value;
                                })
                            }
                        })
                    }
                }, 4);
            },
            save: function(){
                this.editMode = false;

                const dom = Blockly.Xml.workspaceToDom(workspace);

                const $ = cheerio.load(dom.innerHTML);

                _.each(this.fields, (val, key) => {
                    const type = _.split(key, '_')[1];
                    const id = _.split(key, '_')[2];

                    console.log('block', type, id);
                    
                    if(type === 'takeoff'){
                        $(`block[type="${type}"]`).eq(id).find('field').text(val);
                    }
                })

                dom.innerHTML = $.html();

                workspace.clear();
                Blockly.Xml.domToWorkspace(dom, workspace);
            }
        }
    })

    workspace.addChangeListener(() => {
        codeVue.addCode(Blockly.Python.workspaceToCode(workspace));
    })
}

const showCode = (code) => {
    codeVue.addCode(code);
}

export {
    init,
    showCode
}