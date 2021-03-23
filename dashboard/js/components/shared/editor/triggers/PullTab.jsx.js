import React from 'react';
import String from '../../../common/String.jsx.js';
import _ from 'underscore';

class PullTab extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            icons: {
                gift: {
                    text: "Gift",
                    path: "/dashboard/images/integration/gift.png"
                },
                discount: { 
                    text: "Discount", 
                    path: "/dashboard/images/integration/discount.png" 
                },
                money: { 
                    text: "Money", 
                    path: "/dashboard/images/integration/money.png" 
                },
                percent: { 
                    text: "Percent Off", 
                    path: "/dashboard/images/integration/percent.png" 
                },
                sale: { 
                    text: "Sale", 
                    path: "/dashboard/images/integration/sale.png" 
                }
                // gift_black: {
                //     text: "Gift - Black",
                //     path: "/dashboard/images/integration/gift_black.png"
                // },
                // discount_black: { 
                //     text: "Discount - Black", 
                //     path: "/dashboard/images/integration/discount_black.png" 
                // },
                // money_black: { 
                //     text: "Money - Black", 
                //     path: "/dashboard/images/integration/money_black.png" 
                // },
                // percent_black: { 
                //     text: "Percent Off - Black", 
                //     path: "/dashboard/images/integration/percent_black.png" 
                // },
                // sale_black: { 
                //     text: "Sale - Black", 
                //     path: "/dashboard/images/integration/sale_black.png" 
                // }
            },
            tabs: {
                orange: { 
                    text: "Orange", 
                    path: "/dashboard/images/integration/tab_orange.png"
                },
                red: { 
                    text: "Red", 
                    path: "/dashboard/images/integration/tab_red.png" 
                },
                blue: { 
                    text: "Blue", 
                    path: "/dashboard/images/integration/tab_blue.png" 
                },
                purpleblue: { 
                    text: "Purple & Blue", 
                    path: "/dashboard/images/integration/tab_purpleblue.png" 
                },
                green: { 
                    text: "Green", 
                    path: "/dashboard/images/integration/tab_green.png" 
                },
                darkgreen: { 
                    text: "Dark Green", 
                    path: "/dashboard/images/integration/tab_darkgreen.png" 
                },
                teal: { 
                    text: "Teal", 
                    path: "/dashboard/images/integration/tab_teal.png" 
                },
                yellow: { 
                    text: "Yellow", 
                    path: "/dashboard/images/integration/tab_yellow.png" 
                },
                pink: { 
                    text: "Pink", 
                    path: "/dashboard/images/integration/tab_pink.png" 
                },
                black: { 
                    text: "Black", 
                    path: "/dashboard/images/integration/tab_black.png" 
                },
                brown: { 
                    text: "Brown", 
                    path: "/dashboard/images/integration/tab_brown.png" 
                },
                gold: { 
                    text: "Gold", 
                    path: "/dashboard/images/integration/tab_gold.png" 
                },
                silver: { 
                    text: "Silver", 
                    path: "/dashboard/images/integration/tab_silver.png" 
                },
                bamboo: { 
                    text: "Bamboo", 
                    path: "/dashboard/images/integration/tab_bamboo.png" 
                },
                goldsparkle: { 
                    text: "Gold Sparkle", 
                    path: "/dashboard/images/integration/tab_goldsparkle.png" 
                },
                rainbowsparkle: { 
                    text: "Rainbow Sparkle", 
                    path: "/dashboard/images/integration/tab_rainbowsparkle.png" 
                }
                // marble: { 
                //     text: "Marble", 
                //     path: "/dashboard/images/integration/tab_marble.png" 
                // }
            }
        }
    }

    onShowPullOutTabEnable(e) {
        let settings = this.props.settings;
        settings.enabled = !settings.enabled;
        this.props.onChange(settings);
    }

    onIconSelect(e) {
        let settings = this.props.settings;
        settings.icon = e.target.value;
        this.props.onChange(settings);
    }

    onTabSelect(e) {
        let settings = this.props.settings;
        settings.tab = e.target.value;
        this.props.onChange(settings);
    }

    onSetImgSource() { }
    onRemoveImgSource() { }

    render() {
        return (

            <div className="triggers">
                <div className="form-inline m-b-3 m-t-4">
                    <div className="form-group m-t-1">
                        <input type="checkbox"
                            id='pullOutTab'
                            data-switch="color"
                            disabled={false}
                            name='pullOutTab'
                            onChange={(e) => this.onShowPullOutTabEnable(e)}
                            checked={this.props.settings.enabled}
                        />

                        <label htmlFor={'pullOutTab'} />
                    </div>

                    <div className="form-group m-r-2 m-l-4">
                        {/* <String code="sh_label_show_pull_out_tab" /> */}
                        <div className="trigger-title"><String code="sh_trigger_method_pulltab"/></div>
                        <div><String code="sh_label_pulltab_header"/></div>
                    </div>
                </div>

                <div className={this.props.settings.enabled ? "form-inline" : "form-inline trigger-disabled"}>
                    <div className="form-group pulltab-controls m-r-10">
                        <div>
                            <label class="control-label">Tab Icon</label>
                            <select 
                                className="pulltab-select form-control" 
                                onChange={this.onIconSelect.bind(this)} 
                                disabled={!this.props.settings.enabled} 
                                value={this.props.settings.icon}
                            >
                                {
                                    _.keys(this.state.icons).map( iconKey => {
                                        return <option key={iconKey} value={this.state.icons[iconKey].path}>{this.state.icons[iconKey].text}</option>
                                    } )
                                }
                            </select>
                        </div>

                        <div className="m-t-3">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label class="control-label">Tab Style</label>
                            </div>
                            <select 
                                className="pulltab-select form-control"
                                onChange={this.onTabSelect.bind(this)}
                                disabled={!this.props.settings.enabled} 
                                value={this.props.settings.tab}
                            >
                                {
                                    _.keys(this.state.tabs).map( tabKey => {
                                        return <option key={tabKey} value={this.state.tabs[tabKey].path}>{this.state.tabs[tabKey].text}</option>
                                    } )
                                }
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label class="control-label">Preview</label>
                        <div className="pulltab-wrapper">
                            
                            <div className="pulltab">
                                <div className="pulltab-tab">
                                    {/* Note: If this an old cmapaign there won't be a tab image in the props. Instead we'll fallback to the orange tab which is what the old campaigns use by default */}
                                    <img src={this.props.settings.tab || this.state.tabs.orange.path} />
                                </div>
                                <div className={this.props.settings.enabled ? "pulltab-icon gamify_gift-animation" : "pulltab-icon"}>
                                    <img src={this.props.settings.icon} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        )
    }
}


export default PullTab;