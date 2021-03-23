import React from 'react';
import { IndexRoute } from 'react-router';
import { Route } from 'react-router';
import { Redirect } from 'react-router';
import GamifyConsole from '../components/shared/GamifyConsole.jsx.js';

import ExternalError from '../components/shared/ExternalError.jsx';
import Leads from '../components/shared/Leads.jsx';
import Winners from '../components/shared/Winners.jsx';
import MailIntegration from '../components/shared/MailIntegration.jsx.js';
import Integration from '../components/shared/integration/Integration.jsx';
import MyAccount from '../components/shared/myaccount/MyAccount.jsx.js';
import UpdatePassword from '../components/user/UpdatePassword.jsx';
import PageNotFound from '../components/shared/PageNotFound.jsx';

import PortalDashboard from '../components/portal/dashboard/Dashboard.jsx';
import PortalSelectCampaignType from '../components/portal/SelectCampaignType.jsx';

import SlideoutEditor from '../components/gamify/Editor.jsx.js';
import SlideoutCreateCampaign from '../components/gamify/CreateCampaign.jsx';

import SocialEditor from '../components/social/editor/Editor.jsx.js';
import SocialCreateCampaign from '../components/social/dashboard/CreateCampaign.jsx';
import SocialGameChange from '../components/social/dashboard/GameChange.jsx';

import EmailBannerCreateCampaign from '../components/emailbanner/dashboard/CreateCampaign.jsx';
import EmailBannerEditor from '../components/emailbanner/editor/Editor.jsx';

import SurveyResults from '../components/survey/results/Results.jsx';

module.exports = (

    <Route path="/">  
        <Route path="/dashboard/:integration/error" component={ExternalError} />

        {/* Redirect from the old dashboard routes to the new unified dashboard. This will fix anyone who has a bookmark to the old route. */}
        <Redirect from="/dashboard/slideout/:integration" to="/dashboard/portal/:integration"/>
        <Redirect from="/dashboard/social/:integration" to="/dashboard/portal/:integration"/>
        <Redirect from="/dashboard/emailbanner/:integration" to="/dashboard/portal/:integration"/>
        <Redirect from="/dashboard/survey/:integration" to="/dashboard/portal/:integration"/>

        <Route component={GamifyConsole}>
            <Route path="/dashboard/portal/:integration">
                <IndexRoute component={PortalDashboard}/>
                <Route path="/dashboard/portal/:integration/leads" component={Leads} />
                <Route path="/dashboard/portal/:integration/mailintegration" component={MailIntegration} />
                <Route path="/dashboard/portal/:integration/account" component={MyAccount} />
                <Route path="/dashboard/portal/:integration/password" component={UpdatePassword} />
                <Route path="/dashboard/portal/:integration/create" component={PortalSelectCampaignType} />
                <Route path="/dashboard/portal/:integration/integration" component={Integration} />
            </Route> 

            <Route path="/dashboard/slideout/:integration">
                <Route path="/dashboard/slideout/:integration/winners/:campaignHash" component={Winners} />
                <Route path="/dashboard/slideout/:integration/newcampaign" component={SlideoutCreateCampaign} />
                <Route path="/dashboard/slideout/:integration/edit/:campaignHash" component={SlideoutEditor} />
            </Route>

            <Route path="/dashboard/banner/:integration">
                <Route path="/dashboard/emailbanner/:integration/winners/:campaignHash" component={Winners} />
                <Route path="/dashboard/emailbanner/:integration/newcampaign" component={EmailBannerCreateCampaign} />
                <Route path="/dashboard/emailbanner/:integration/edit/:campaignHash" component={EmailBannerEditor} />
            </Route>

            <Route path="/dashboard/social/:integration">
                <Route path="/dashboard/social/:integration/winners/:campaignHash" component={Winners} />
                {/* 
                    There are two newcampaign routes. One with a campaign hash and one without.
                    The one with the campaign hash tells us that the campaign has already been created and the theme and game need to be added to it.
                    The one without tells us to create a new campaign first, then add the theme and game.
                 */}
                <Route path="/dashboard/social/:integration/newcampaign/:campaignHash" component={SocialCreateCampaign} />
                <Route path="/dashboard/social/:integration/newcampaign" component={SocialCreateCampaign} />
                <Route path="/dashboard/social/:integration/gamechange/:campaignHash" component={SocialGameChange} />
                <Route path="/dashboard/social/:integration/edit/:campaignHash" component={SocialEditor} />
            </Route>

            {/* <Route path="/dashboard/survey/:integration">
                <Route path="/dashboard/survey/:integration/winners/:campaignHash" component={Winners} />
                <Route path="/dashboard/survey/:integration/results/:campaignHash" component={SurveyResults} /> */}
                {/* 
                    There are two newcampaign routes. One with a campaign hash and one without.
                    The one with the campaign hash tells us that the campaign has already been created and the theme and game need to be added to it.
                    The one without tells us to create a new campaign first, then add the theme and game.
                 */}
                {/* <Route path="/dashboard/survey/:integration/newcampaign/:campaignHash" component={SocialCreateCampaign} />
                <Route path="/dashboard/survey/:integration/newcampaign" component={SocialCreateCampaign} />
                <Route path="/dashboard/survey/:integration/edit/:campaignHash" component={SocialEditor} />
            </Route> */}
        </Route>

        {/* <Redirect from="/dashboard/:integration" to="/dashboard/slideout/:integration"/> */}
        {/* <Redirect from="/dashboard/:integration/mailintegration" to="/dashboard/slideout/:integration/mailintegration"/> */}

        {/* No Matching Routes */}
        <Route path="*" component={PageNotFound} />
    </Route>
);

