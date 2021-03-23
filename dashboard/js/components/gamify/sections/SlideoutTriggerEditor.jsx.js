import React from 'react';
import String from '../../common/String.jsx';
import Loading from '../../shared/Loading.jsx';

import SlideOut from '../../shared/editor/triggers/SlideOut.jsx';
import PullTab from '../../shared/editor/triggers/PullTab.jsx';
import ExitIntent from '../../shared/editor/triggers/ExitIntent.jsx';
import PrizeBar from '../../shared/editor/triggers/PrizeBar.jsx';
import UrlFiltering from '../../shared/editor/triggers/UrlFiltering.jsx';
import ScrollUtils from '../../shared/util/ScrollUtils';



class SlideoutTriggerEditor extends React.Component {

    constructor ( props ) {

        super( props );

        let cdI = this.props.campaignDetails.integration;
        let cdIUI = (cdI && cdI.uiConfig) ? cdI.uiConfig : {};

        this.state = {
            prizeBar:     (cdIUI.prizeBar)     ?  cdIUI.prizeBar: null,
            pullTab:      (cdIUI.pullTab)      ?  cdIUI.pullTab: null,
            slideOut:     (cdIUI.slideOut)     ?  cdIUI.slideOut: null,
            urlFiltering: (cdIUI.urlFiltering) ?  cdIUI.urlFiltering: null
        };
    }

    componentDidUpdate () {
        // If the parent is telling us to scroll to the next error, figure out where to go.
        // Each component can handle what info it needs to store and reference to decide what the next best error to scroll to is.
        // (There might be more than one). In this components case, all the errors that are being checked are in the prize table
        // so just scroll there.
        if (this.props.scrollToError) {
            ScrollUtils.smoothScroll("urlFilters", () => { this.props.onScrollToErrorComplete() } );
        }
    }

    update ( stateKey, settings, themeDescriptor ) {
        this.setState(
            { [stateKey]: settings },
            () => {
                this.props.onUpdate(this.state, themeDescriptor);
            }
        )
    }

    onPullTabChange ( settings ) {
        this.update("pullTab", settings);
    }

    onSlideOutChange ( settings ) {
        this.update("slideOut", settings);
    }

    onUrlFilteringChange( settings ) {
        this.update("urlFiltering", settings);
    }

    onPrizeBarChange( settings, themeDescriptor ) {
        this.update("prizeBar", settings, themeDescriptor);
    }

    areAllTriggersDisabled () {
        // By default, assume everything is turned off, then check each included trigger to see if it's enabled and can negate this value.
        let allDisabled = true;

        // If the pulltab is included and is turned on, then everything can't be disabled.
        if (this.state.pullTab && this.state.pullTab.enabled) allDisabled = false;

        // If the slideout.desktop.showAfterDelay is included and is turned on, then everything can't be disabled.
        if (this.state.slideOut && this.state.slideOut.desktop && this.state.slideOut.desktop.showAfterDelay && this.state.slideOut.desktop.showAfterDelay.enabled) allDisabled = false;

        // If the slideout.desktop.showOnLeaveIntent is included and is turned on, then everything can't be disabled.
        if (this.state.slideOut && this.state.slideOut.desktop && this.state.slideOut.desktop.showOnLeaveIntent && this.state.slideOut.desktop.showOnLeaveIntent.enabled) allDisabled = false;
    
        // At this point, if all triggers that are included are not enabled then allDisabled is still true
        return allDisabled;
    }

    render () {

        if ( this.state.initLoad ) { return <Loading />; }

        return (
            <div className="settings">
                <div className="container">

                    <div className="panel panel-default">

                        <div className="panel-heading">
                            <div className="panel-heading-label">
                                <h1>Slide-Out Presentation</h1>
                                <h3 className="subheading"><String code="sh_label_configure_appear"/></h3>
                            </div>
                        </div>


                        <div className="panel-body">
                            <div className="col-xs-12 m-t-2 m-b-2">

                                <div>
                                    <h4>Triggers</h4>
                                    <div className="p-b-3"><String code="sh_label_trigger_header"/></div>
                                    
                                    {/** Pull Tab Section **/}
                                    { this.state.pullTab ? 
                                        <div className="m-l-3 p-t-3 p-b-3">
                                            <PullTab settings={this.state.pullTab} onChange={this.onPullTabChange.bind( this )} />
                                        </div>
                                        :
                                        null
                                    }

                                    {/** Auto Slideout Section **/}
                                    { this.state.slideOut && this.state.slideOut.desktop && this.state.slideOut.desktop.showAfterDelay ? 
                                        <div className="m-l-3 p-t-3 p-b-3">
                                            <SlideOut settings={this.state.slideOut} onChange={this.onSlideOutChange.bind( this )} showTabNote={true} />
                                        </div>
                                        :
                                        null
                                    }

                                    {/** Exit Intent Section **/}
                                    { this.state.slideOut && this.state.slideOut.desktop && this.state.slideOut.desktop.showOnLeaveIntent  ? 
                                        <div className="m-l-3 p-t-3 p-b-3">
                                            <ExitIntent settings={this.state.slideOut} onChange={this.onSlideOutChange.bind( this )} />
                                        </div>
                                        :
                                        null
                                    }
                                </div>

                                { /* Check if all the triggers have been disabled */ }
                                { this.areAllTriggersDisabled() ?
                                    <div className="alert alert-danger" style={{ maxWidth: "800px" }}><i className="material-icons" style={{ height: "initial", verticalAlign: "middle", paddingRight: "30px", top: "-2px" }}>warning</i>&nbsp;&nbsp;<String code="sh_label_all_disabled_warning"/></div>
                                    :
                                    null
                                }

                                { this.state.prizeBar ? 
                                    <div>
                                        <div className="clearfix"><hr/></div>
                                        <div className="m-t-3 m-b-3">
                                            <h4>Prize Banner</h4>
                                            <div><String code="sh_label_prizebar_header"/></div>
                                            <PrizeBar 
                                                themeDescriptor={this.props.themeDescriptor}
                                                settings={this.state.prizeBar} 
                                                onChange={this.onPrizeBarChange.bind( this )} 
                                            />
                                        </div>
                                    </div>
                                    :
                                    null
                                }
                                

                                 { this.state.urlFiltering ? 
                                    <div>
                                        <div className="clearfix"><hr/></div>
                                        <div id="urlFilters" className="m-t-3 m-b-3">
                                            <h4><String code="sh_label_url_filters"/></h4>
                                            <div><String code="sh_label_urlfiltering_header"/></div>
                                            <UrlFiltering settings={this.state.urlFiltering} onChange={this.onUrlFilteringChange.bind( this )} />
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
        );
    }
}


module.exports = SlideoutTriggerEditor;
