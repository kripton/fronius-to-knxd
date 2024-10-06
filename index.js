#!/usr/bin/env node

const process = require('process');
const child_process = require('child_process');
const knxDPT = require('knx-datapoints');

if (!process.env.FRONIUS_HOST) {
    console.error('environment variable FRONIUS_HOST is not defined');
    process.exit(-1);
}
if (!process.env.KNXD_HOST) {
    console.error('environment variable KNXD_HOST is not defined');
    process.exit(-1);
}

(async () => {
    const res1 = await fetch('http://' + process.env.FRONIUS_HOST + '/solar_api/v1/GetPowerFlowRealtimeData.fcgi');
    const powerFlowRealtimeData = JSON.parse(await res1.text()).Body.Data;
    //const res2 = await fetch('http://' + process.env.FRONIUS_HOST + '/solar_api/v1/GetMeterRealtimeData.cgi');
    //const meterRealtimeData = JSON.parse(await res2.text()).Body.Data['0'];

    // Encode the values, as hex string, with a space every 3rd character
    const p_grid = knxDPT.encode('14.056', powerFlowRealtimeData.Site.P_Grid).toString('hex').replace(/.{2}/g, '$& ');
    const p_load = knxDPT.encode('14.056', powerFlowRealtimeData.Site.P_Load).toString('hex').replace(/.{2}/g, '$& ');
    const p_pv   = knxDPT.encode('14.056', powerFlowRealtimeData.Site.P_PV).toString('hex').replace(/.{2}/g, '$& ');
    const p_akku = knxDPT.encode('14.056', powerFlowRealtimeData.Site.P_Akku).toString('hex').replace(/.{2}/g, '$& ');
    const soc    = knxDPT.encode('9.007',  powerFlowRealtimeData.Inverters['1'].SOC).toString('hex').replace(/.{2}/g, '$& ');

    console.log('p_grid\tValue: ' + powerFlowRealtimeData.Site.P_Grid + '\tEncoded:' + p_grid);
    console.log('p_load\tValue: ' + powerFlowRealtimeData.Site.P_Load + '\tEncoded:' + p_load);
    console.log('p_pv  \tValue: ' + powerFlowRealtimeData.Site.P_PV   + '\tEncoded:' + p_pv);
    console.log('p_akku\tValue: ' + powerFlowRealtimeData.Site.P_Akku   + '\tEncoded:' + p_akku);
    console.log('soc   \tValue: ' + powerFlowRealtimeData.Inverters['1'].SOC + '\tEncoded:' + soc);


    // Write the values to the KNX bus
    child_process.execSync('knxtool groupwrite ip:' + process.env.KNXD_HOST + ' ' + '0/3/2' + ' ' + p_grid, {stdio: ['ignore', 'pipe', 'ignore']});
    child_process.execSync('knxtool groupwrite ip:' + process.env.KNXD_HOST + ' ' + '0/3/1' + ' ' + p_pv, {stdio: ['ignore', 'pipe', 'ignore']});
    child_process.execSync('knxtool groupwrite ip:' + process.env.KNXD_HOST + ' ' + '0/3/0' + ' ' + soc, {stdio: ['ignore', 'pipe', 'ignore']});
    child_process.execSync('knxtool groupwrite ip:' + process.env.KNXD_HOST + ' ' + '0/3/3' + ' ' + p_akku, {stdio: ['ignore', 'pipe', 'ignore']});
    child_process.execSync('knxtool groupwrite ip:' + process.env.KNXD_HOST + ' ' + '0/3/4' + ' ' + p_load, {stdio: ['ignore', 'pipe', 'ignore']});

    process.exit(0);
})();
