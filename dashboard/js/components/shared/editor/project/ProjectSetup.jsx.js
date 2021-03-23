import React from 'react';
import String from '../../../common/String.jsx';
import ValidationError from '../../../common/ValidationError.jsx';


class ProjectSetup extends React.Component {

    constructor ( props ) {
        super( props );

        let cd = this.props.campaignDetails;

        this.state = {
            asset: null,
            campaignProjectName: (cd.name) ? cd.name: 'campaign name',
            campaignDetails: cd,
            lastResponse: null

        };

        this.notifyParent = this.notifyParent.bind(this);
    }


    onNameChange(e) {

        this.setState( { campaignProjectName: e.target.value }, function () {
            this.notifyParent();
        } );

    }



    notifyParent() {
        let params = {
            name: this.state.campaignProjectName
        };

        this.props.onUpdate(params);
    }



    render () {


        return (
            <div className="settings">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <h1>
                                    <String code="sh_label_project_name" />
                                </h1>
                            </div>
                        </div>
                        <div className="panel-body">
                            <div className="col-xs-12 m-t-2">

                                <div className="form">
                                    <div className="form-group">
                                        {/** Project Name **/}
                                        <input type="text" className="form-control"
                                               name='campaignProjectName'
                                               value={this.state.campaignProjectName}
                                               onChange={this.onNameChange.bind(this)} readOnly={this.props.readOnly}
                                        />
                                        <ValidationError response={this.props.lastResponse} field="name"/>
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

module.exports = ProjectSetup;