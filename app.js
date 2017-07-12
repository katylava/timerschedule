#!/usr/bin/env node
const TimerSchedule = require('./TimerSchedule').TimerSchedule

const moment = require('moment')
require('moment-duration-format')
const yaml = require('yamljs')

const timers = yaml.load('./schedule.yml')

if (require.main === module) {
    var myTimer = new TimerSchedule(timers, process.argv[2])
    var startAt = process.argv[3] ? moment(process.argv[3], myTimer.format).toDate() : null

    if (process.argv[4]) {
        console.log(myTimer.schedule(startAt))
    } else {
        myTimer.start(startAt)
        myTimer.cliEmitterHandler()

        myTimer.emitter.on('done', process.exit)
    }
}
