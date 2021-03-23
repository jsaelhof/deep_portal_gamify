import React from 'react';
import i18n from '../../../../store/i18nStore';
import _ from 'underscore';
import GUID from '../../../../util/guid';

class DataCollection extends React.Component {

    constructor ( props ) {
        super( props );
        this.state = {
            showEditForm: false,
            formMode: undefined,
            formTemplate: undefined,
            editField: undefined,
            newOption: undefined
        };

        this.dataCollectionTemplates = {
            text: {
                type: "text",
                label: "",
                editorLabel: "Custom Text Field",
                input: "text",
                validation: {
                    required: false
                }
            },
            number: {
                type: "decimal",
                label: "",
                editorLabel: "Custom Number Field",
                input: "number",
                validation: {
                    required: false
                }
            },
            select: {
                type: "text",
                label: "",
                editorLabel: "Custom Dropdown Menu",
                input: "select",
                options: [],
                validation: {
                    required: false
                }
            },
            checkbox: {
                type: "checkbox",
                label: "",
                editorLabel: "Custom Checkbox",
                input: "checkbox",
                validation: {
                    required: false
                },
                value: false
            },
            emailoptin: {
                type: "checkbox",
                label: "Email Opt-In",
                editorLabel: "Email Opt-In",
                input: "checkbox",
                validation: {
                    required: false
                },
                value: false
            },
            age: {
                type: "integer",
                label: "Age",
                editorLabel: "Age",
                input: "number",
                validation: {
                    required: false,
                    min: 1,
                    max: 120
                }
            },
            address: {
                type: "text",
                label: "Address",
                editorLabel: "Address",
                input: "text",
                validation: {
                    required: false,
                    max: 100
                }
            },
            city: {
                type: "text",
                label: "City",
                editorLabel: "City",
                input: "text",
                validation: {
                    required: false,
                    max: 100
                }
            },
            phonenumber: {
                type: "text",
                label: "Phone Number",
                editorLabel: "Phone Number",
                input: "text",
                validation: {
                    required: false,
                    max: 25
                }
            },
            postalcode: {
                type: "text",
                label: "Postal/Zip Code",
                editorLabel: "Postal/Zip Code",
                input: "text",
                validation: {
                    required: false,
                    max: 20
                }
            },
            gender: {
                type: "text",
                label: "Gender",
                editorLabel: "Gender",
                input: "select",
                options: ["Male", "Female"],
                validation: {
                    required: false
                }
            },
            country: {
                type: "text",
                label: "Country",
                editorLabel: "Country",
                input: "country",
                validation: {
                    required: false
                }
            },
            state: {
                type: "text",
                label: "State / Province",
                editorLabel: "State / Province (Requires Country)",
                input: "state",
                validation: {
                    required: false
                }
            }
        }
    }

    componentWillMount () {
    }

    componentWillUnmount () {
    }

    onEditField ( key ) {
        //console.log("onEditField");
        // If we are already editng this field, just ignore the edit command.
        if (this.state.editField && key === this.state.editField.id) return;

        // To edit, we need to create a copy of the current state of the field data to be edited. 
        // This allows the user to cancel and revert everythign back to the original state because we just toss the copy.
        // However, using the spread operator does a shallow copy.
        // In the case of a select item, the options array is not deep-copied becuase it's nested. 
        // It gets copied by reference and you end up editing the original options data.
        // To fix this, i'm doing a JSON.stringify -> JSON.parse. This is fast and works well provided dates and regex's aren't involved.
        // Since we aren't using those, this works fine.
        this.setState( {
            showEditForm: true,
            formMode: "edit",
            editField: JSON.parse(JSON.stringify( this.props.campaignDetails.forms.ENTRY_PAGE[key] ))
        } )
    }

    orderUp ( index ) {
        this.swap( index - 1, index );
    }

    orderDown ( index ) {
        this.swap( index + 1, index );
    }

    swap ( indexA, indexB ) {
        let fields = _.sortBy(this.props.campaignDetails.forms.ENTRY_PAGE, "displayIndex");

        if (indexA < 0 || indexA === fields.length || indexB < 0 || indexB === fields.length) return;

        let targetId = fields[indexA].id;
        let toMoveId = fields[indexB].id;
        let targetDisplayIndex = fields[indexA].displayIndex;
        let toMoveDisplayIndex = fields[indexB].displayIndex;

        let updatedForms = { ...this.props.campaignDetails.forms };
        updatedForms.ENTRY_PAGE[ targetId ].displayIndex = toMoveDisplayIndex;
        updatedForms.ENTRY_PAGE[ toMoveId ].displayIndex = targetDisplayIndex;

        // update the preview with the newly ordered data fields
        window.frames.preview.postMessage( JSON.stringify( { type: 'data', data: updatedForms } ), "*" );

        this.props.onUpdate(updatedForms);
    }

    toggleRequired ( key ) {
        let updatedForms = { ...this.props.campaignDetails.forms };
        updatedForms.ENTRY_PAGE[key].validation.required = !updatedForms.ENTRY_PAGE[key].validation.required;
        // update the preview with the updated required fields
        window.frames.preview.postMessage( JSON.stringify( { type: 'data', data: updatedForms } ), "*" );
        this.props.onUpdate(updatedForms);
    }

    delete ( key ) {
        if (this.state.editField && key === this.state.editField.id) {
            this.closeEditForm();
        }
        let updatedForms = { ...this.props.campaignDetails.forms };
        delete updatedForms.ENTRY_PAGE[key];

        // If there is no country found in the form anymore, delete any state fields
        if (_.where(updatedForms.ENTRY_PAGE, { input: "country" }).length === 0) {
            _.pluck(_.where(updatedForms.ENTRY_PAGE, { input: "state" }), "id").forEach( key => {
                delete updatedForms.ENTRY_PAGE[key];
            } );
        }

        // update the preview with the data field removed
        window.frames.preview.postMessage( JSON.stringify( { type: 'data', data: updatedForms } ), "*" );

        this.props.onUpdate(updatedForms);
    }

    onAddField () {
        let defaultFormTemplate = "text";
        this.setState( 
            { 
                showEditForm: true,
                formMode: "add",
                formTemplate: defaultFormTemplate,
                editField: this.getNewFieldForType( defaultFormTemplate )
            } 
        );
    }

    onFormTypeChange ( event ) {
        //console.log("onFormTypeChange");
        this.setState( {
            formTemplate: event.target.value,
            editField: this.getNewFieldForType( event.target.value ),
            invalidFieldLabel: false,
            newOption: undefined
        } );
    }

    getNewFieldForType ( templateId ) {
        //console.log("getNewFieldForType");
        // Create a field by copying the template
        let newField = JSON.parse(JSON.stringify(this.dataCollectionTemplates[templateId]));

        // Add custom data to the field
        newField.id = GUID.guid();
        newField.removable = true; // Any field that is custom added can be removed.

        // Get the next display index by finding the largest current index.
        let largestIndex = 0;
        _.each(this.props.campaignDetails.forms.ENTRY_PAGE, field => {
            if (parseInt(field.displayIndex) > largestIndex) {
                largestIndex = parseInt(field.displayIndex);
            }
        } );
        newField.displayIndex = largestIndex + 1;

        // Remove any data from the template that shouldn't be saved in the campaign details
        delete newField.editorLabel;
        delete newField.limit;

        return newField;
    }

    getFormForField ( field ) {
        switch (field.input) {
            case "text":
            case "email":
            case "country":
                return <div key={field.id}>
                        <div className="form-group">
                            <label className="control-label">Label</label>
                            <input className={this.state.invalidFieldLabel ? "form-control invalid-field" : "form-control"} type="text" onChange={ this.onFieldLabelChange.bind(this) } value={field.label} />
                        </div>
                    </div>
                break;
            case "state":
                return <div key={field.id}>
                        <div className="form-group">
                            <label className="control-label">Label</label>
                            <input className={this.state.invalidFieldLabel ? "form-control invalid-field" : "form-control"} type="text" onChange={ this.onFieldLabelChange.bind(this) } value={field.label} />
                        </div>
                        <div className="editor-subtext">Adding a State / Province field will automatically insert a Country field if one does not exist. If the Country field is later removed from the entry form, any State / Province fields will also be removed.</div>
                    </div>
                break;
            case "number":
                return <div key={field.id}>
                        <div className="form-group">
                            <label className="control-label">Label</label>
                            <input className={this.state.invalidFieldLabel ? "form-control invalid-field" : "form-control"} type="text" onChange={ this.onFieldLabelChange.bind(this) } value={field.label} />
                        </div>
                    </div>
                break;
            case "select":
                return <div key={field.id}>
                        <div className="form-group">
                            <label className="control-label">Label</label>
                            <input className={this.state.invalidFieldLabel ? "form-control invalid-field" : "form-control"} type="text" onChange={ this.onFieldLabelChange.bind(this) } value={field.label} />
                        </div>
                        <div className="form-group">
                            <label className="control-label">Add Option</label>
                            <div className="dc-add-option">
                                <input className={this.state.invalidOptions ? "form-control invalid-field" : "form-control"} type="text" onChange={ this.onAddOptionChange.bind(this) } value={this.state.newOption} />
                                <button className="btn-primary btn-xs" onClick={this.onAddOption.bind(this)}>+</button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="control-label">Options</label>
                            {
                                field.options.length > 0 ?
                                    <table className="table-dc-options">
                                        <tbody>
                                            { 
                                                field.options.map( (option, index) => {
                                                    return <tr key={"tr_option_"+option.replace(" ","_")}>
                                                        <td><button className="btn"><i className="material-icons" onClick={ this.onDeleteOption.bind(this, option, index) }>close</i></button></td>
                                                        <td>{option}</td>
                                                    </tr>
                                                } ) 
                                            }
                                        </tbody>
                                    </table>
                                    :
                                    <div className="m-t-1 m-b-2" style={{ fontStyle: "italic", color:"#ccc" }}>No Options</div>
                            }
                        </div>
                        <div className="form-group">
                            <label className="control-label">Default Option</label>
                            <select className="form-control" value={ field.value !== undefined ? field.options.indexOf(field.value) : undefined } onChange={this.onDefaultOptionChange.bind(this)}>
                                <option key={"default_none"} value={-1}>No Default Option</option>  
                                {
                                    field.options.map( (option, index) => {
                                        return <option key={"default_"+index} value={index}>{option}</option>  
                                    } )
                                }
                            </select>
                        </div>
                    </div>
                break;
            case "checkbox":
                return <div key={field.id}>
                        <div className="form-group">
                            <label className="control-label">Label</label>
                            <input className={this.state.invalidFieldLabel ? "form-control invalid-field" : "form-control"} type="text" onChange={ this.onFieldLabelChange.bind(this) } value={field.label} />
                        </div>
                        <div className="form-group dc-checkbox">
                            <input type="checkbox" onChange={ this.onCheckboxChange.bind(this) } defaultChecked={ field.value }/>
                            <label>Check box by default</label>
                        </div>
                    </div>
                break;
        }
    }

    onAddOptionChange (e) {
        //console.log("onAddOptionChange");
        this.setState( { newOption: e.target.value, invalidOptions: false } );
    }

    onAddOption (e) {
        //console.log("onAddOption");
        if (!this.state.newOption || this.state.newOption.length === 0) {
            this.setState( { invalidOptions: true } );
        } else {
            let updatedField = {...this.state.editField};
            updatedField.options.push(this.state.newOption);
            this.setState( { editField: updatedField, newOption: "", invalidOptions: false } );
        }
    }

    onDeleteOption ( option, index ) {
        let updatedField = {...this.state.editField};
        updatedField.options.splice(index, 1);
        this.setState( { editField: updatedField } );
    }

    onDefaultOptionChange ( e ) {
        //console.log("onDefaultOptionChange");
        // If the value is -1, it's the "No Default" option.
        // Instead of setting the default, clear it.
        if (e.target.value === "-1") {
           this.updateFieldData( "value", undefined);
        } else {
            this.updateFieldData( "value", this.state.editField.options[e.target.value] );
        }
    }

    onCheckboxChange (e) {
        //console.log("onCheckboxChange");
        this.updateFieldData( "value", e.currentTarget.checked );
    }

    onFieldLabelChange (e) {
        //console.log("onFieldLabelChange");
        let label =  e.currentTarget.value;
        this.setState( { invalidFieldLabel: false }, () => {
            this.updateFieldData( "label", label);
        } );
    }

    updateFieldData ( key, value ) {
        //console.log("updateFieldData");
        let updatedField = {...this.state.editField};
        updatedField[key] = value;
        this.setState( { editField: updatedField } );
    }

    // When the apply button is clicked, validate the form and if it's good, update the parent.
    onApplyNewField () {
        //console.log("onApplyNewField");
        let hasErrors = false;

        if (!this.state.editField.label || this.state.editField.label.length === 0) {
            hasErrors = true;
            this.setState( { invalidFieldLabel: true } );
        } 
        
        if (this.state.editField.options && this.state.editField.options.length === 0) {
            hasErrors = true;
            this.setState( { invalidOptions: true } );
        }

        if ( !hasErrors ) {
            let updatedForms = { ...this.props.campaignDetails.forms };

            if ( this.state.editField.input === "state" && _.where(this.props.campaignDetails.forms.ENTRY_PAGE,{ input: "country" }).length === 0 ) {
                let countryField = this.getNewFieldForType("country");

                // Special display order case. The country field needs to come first in the list otherwise it appears below the state but must be filled out first in order to populate the state field.
                // Since both fields are being created at once they will end up with the same display index. What we have to do is force the state index up by one.
                this.state.editField.displayIndex++;

                updatedForms.ENTRY_PAGE[countryField.id] = countryField;
            }

            updatedForms.ENTRY_PAGE[this.state.editField.id] = this.state.editField;

            this.closeEditForm( () => {
                // update the preview with the new data field
                window.frames.preview.postMessage( JSON.stringify( { type: 'data', data: updatedForms } ), "*" );

                this.props.onUpdate(updatedForms);
            } )
        }
    }

    onCancelNewField () {
        //console.log("onAddOptionChange");
        this.closeEditForm();
    }

    closeEditForm ( callback ) {
        //console.log("onAddOptionChange");
        this.setState( { 
            editField: undefined,
            showEditForm: false,
            formMode: undefined,
            formTemplate: undefined,
            invalidFieldLabel: false,
            invalidOptions: false,
            newOption: ""
        }, () => {
            if (callback) callback();
        } );
    }

    generateDataCollectionTable () {
        let headerCells = <tr>
            <td>Field</td>
            <td>Type</td>
            <td>Required</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>

        let rows = [];

        let fields = _.sortBy(this.props.campaignDetails.forms.ENTRY_PAGE,"displayIndex");

        fields.map( (field, index) => {

            let firstField = index === 0;
            let lastField = index === fields.length - 1;

            let rowClass = "";
            if (this.state.formMode === "edit") {
                if (this.state.editField.id === field.id) {
                    rowClass = "dcfield-active-row";
                } else {
                    rowClass = "dcfield-disabled-row";
                }
            }

            rows.push (
                <tr key={field.id} className={rowClass}>
                    <td onClick={this.onEditField.bind(this, field.id)}>{field.label}</td>
                    <td onClick={this.onEditField.bind(this, field.id)}>{i18n.stringFor("field_input_" + field.input)}</td>

                    <td className="dcfield-control dcfield-required"><input type="checkbox" defaultChecked={field.validation.required} disabled={!field.removable} onClick={this.toggleRequired.bind(this, field.id)}/></td>
                    <td className="dcfield-control"><button className="material-icons-button" onClick={ this.onEditField.bind(this, field.id) }><i className="material-icons dcfield-edit">edit</i></button></td>
                    
                    <td className="dcfield-control">
                        <button className="material-icons-button" onClick={this.orderUp.bind(this, index)} disabled={firstField}>
                            <i className={"material-icons dcfield-up " + (firstField ? "dcfield-disable-arrow" : "")}>keyboard_arrow_up</i>
                        </button>
                    </td>

                    <td className="dcfield-control">
                        <button className="material-icons-button" onClick={this.orderDown.bind(this, index)} disabled={lastField}>
                            <i className={"material-icons dcfield-down " + (lastField ? "dcfield-disable-arrow" : "")}>keyboard_arrow_down</i>
                        </button>
                    </td>

                    {
                        field.removable ?
                            <td className="dcfield-control"><button className="material-icons-button" onClick={this.delete.bind(this, field.id)}><i className="material-icons dcfield-delete">close</i></button></td>
                            :
                            <td className="dcfield-control"><button className="material-icons-button" disabled={true}><i className="material-icons dcfield-lock">lock_outline</i></button></td>
                    }
                </tr>
            )
        } );

        return (
            <table className="table dc-table">
                <thead>
                    {headerCells}
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        );
    }

    render () {
        return (
            <div className="settings" id="datacollection">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <div className="panel-title">
                                    <h1>User Entry Form</h1>
                                </div>
                                <h3 className="subheading">Setup the information you want to collect when someone plays your campaign.</h3>
                            </div>
                        </div>
                        <div className="panel-body">
                            <div className="m-t-1">
                                <div>Learn more about your customers! Customize your campaign's entry form to collect additional information from your players.</div>
                                <div className="editor-subtext">The "Email" field cannot be removed. It is required to uniquely identify each player.</div>
                                <div className="dc">
                                    <div className="dc-fields">
                                        { 
                                            this.generateDataCollectionTable()
                                        }
                                        <button className="btn btn-primary round m-b-3 m-r-4" onClick={this.onAddField.bind(this)} disabled={this.state.showEditForm}>+ Add Field</button>
                                    </div>
                                    
                                    <div className="dc-form">
                                        {
                                            this.state.showEditForm ?
                                                <div>
                                                    { this.state.formMode === "add" ?
                                                        <div className="form-group">
                                                            <label className="control-label">Field Type</label>
                                                        
                                                            <select className="form-control" value={ this.state.formTemplate } onChange={this.onFormTypeChange.bind(this)}>
                                                                { 
                                                                    // Loop over the templates and fill the drop down menu
                                                                    _.map(_.keys(this.dataCollectionTemplates), key => {
                                                                        return <option key={key} value={key}>{this.dataCollectionTemplates[key].editorLabel}</option>
                                                                    } )
                                                                }
                                                            </select>
                                                        </div>
                                                        :
                                                        null
                                                    }

                                                    {
                                                        this.getFormForField( this.state.editField )
                                                    }
                                                    
                                                    <div className="dc-form-actions">
                                                        <button className="btn btn-primary btn-xs m-t-2 m-r-2" onClick={this.onApplyNewField.bind(this)}>Apply</button>
                                                        <button className="btn btn-default btn-xs m-t-2 m-r-2" onClick={this.onCancelNewField.bind(this)}>Cancel</button>
                                                    </div>
                                                </div>
                                                :
                                                null
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = DataCollection;