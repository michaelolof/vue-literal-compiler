/** @VueLiteralCompiler Template */
const template = (app:App) => html`
<template lang="jade">
  <div class="profile">
    <div class="month-of-year center">
      <span class="left-nav icon earnie-icon-angle-left-slim" v-show="previousEarning" :title="previousMonth" @click="gotoPreviousMonth"></span>
      <!-- <span class="left-nav icon earnie-icon-angle-left-slim" v-show="previousEarning" :title="transformYearAndMonth( previousYearAndMonth )"></span> -->
        {{ transformYearAndMonth( currentYearAndMonth ) }}
      <!-- <span class="right-nav icon earnie-icon-angle-right-slim" v-show="nextYearAndMonth" :title="transformYearAndMonth( nextYearAndMonth )"></span> -->
      <span class="right-nav icon earnie-icon-angle-right-slim" v-show="nextEarning" :title="nextMonth" @click="gotoNextMonth"></span>
    </div>
    <ThreeColStatsGrid>
      <template slot="col-1-label">Viewed Ads</template>
      <template slot="col-1-value">{{ getUser("adViews") }}</template>
      <template slot="col-2-label">Current Earnings</template>
      <template slot="col-2-value">{{ monthlyEarning }}</template>
      <template slot="col-3-label">Total Earning</template>
      <template slot="col-3-value">\${{ getUser("totalEarnings") }}</template>
    </ThreeColStatsGrid>
    <div class="clear-float"></div>
  </div>
</template>
`;


/**      ------     SCRIPTS     ------      */
//@ts-ignore
import { Component, Vue } from "vue-property-decorator";
//@ts-ignore
import Vue from "./one.mock";

@Component
//@ts-ignore
export default class App extends Vue {
  
}


/** @VueLiteralCompiler Styles */
const styles = `
`;