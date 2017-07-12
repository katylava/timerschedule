#!/usr/bin/env node
const EventEmitter = require('events')
const readline = require('readline')

const moment = require('moment')
require('moment-duration-format')
const notifier = require('node-notifier')

const FORMATS = ['hh:mma', 'h:mma', 'hh:mm a', 'h:mm a', 'hh:mm:ssa', 'h:mm:ssa', 'hh:mm:ss a', 'h:mm:ss a']


class TimerEmitter extends EventEmitter {}


class TimerSchedule {

    constructor(timers, timer, tickLength) {
        if (!timers[timer]) {
            throw new Error(`No timer named ${timer}`)
        }
        this.agenda = null
        this.currentStep = -1
        this.emitter = new TimerEmitter()
        this.format = 'h:mm:ss a'
        this.intervalId = null
        this.steps = timers[timer].map(t => TimerSchedule.parse(t))
        this.tickLength = tickLength || 1000
        this.timers = timers
    }

    schedule(startAt, stopAt, schedule) {
        let time = moment(startAt)

        if (stopAt instanceof Map) {
            schedule = stopAt
            stopAt = null
        }

        if (!schedule) {
            schedule = new Map()
        }

        for (let step of this.steps) {
            if (stopAt && time.toDate() > stopAt) {
                break
            }

            let func = step.get('func')

            if (step.get('label')) {
                schedule.set(time.format(this.format), step.get('label'))
            }

            if (func === 'doFor') {
                time.add(parseInt(step.get('count')), step.get('units'))
                continue
            }

            if (func === 'doUntil') {
                time = moment(step.get('time'), FORMATS)
                continue
            }

            if (func === 'runFor') {
                let ts = new TimerSchedule(this.timers, step.get('timer'))
                let end = moment(time).add(parseInt(step.get('count')), step.get('units')).toDate()

                if (stopAt && end > stopAt) {
                    end = stopAt
                }

                ts.schedule(time.toDate(), end, schedule)

                let times = Array.from(schedule.keys())

                time = moment(times[times.length - 1], this.format)
                continue
            }

            if (func === 'runUntil') {
                let ts = new TimerSchedule(this.timers, step.get('timer'))
                let end = moment(step.get('time'), FORMATS).toDate()

                if (stopAt && end > stopAt) {
                    end = stopAt
                }

                ts.schedule(time.toDate(), end, schedule)

                time = moment(end)
                continue
            }

            if (func === 'runTimes') {
                let ts = new TimerSchedule(this.timers, step.get('timer'))

                for (let i in Array(parseInt(step.get('count'))).fill()) {
                    ts.schedule(time.toDate(), stopAt, schedule)
                    let times = Array.from(schedule.keys())

                    time = moment(times[times.length - 1], this.format)

                    if (stopAt && time.toDate() >= stopAt) {
                        break
                    }
                }
            }
        }

        if (stopAt && time.toDate() < stopAt) {
            this.schedule(time.toDate(), stopAt, schedule)
        } else {
            if (stopAt && time.toDate() > stopAt) {
                time = moment(stopAt)
            }

            schedule.set(time.format(this.format), 'stop')
        }

        this.agenda = schedule
        return this.agenda
    }

    start(startAt) {
        let agenda = this.schedule(startAt).entries()
        let next = agenda.next()
        let steps = []

        while (!next.done) {
            let value = {
                label: next.value[1],
                start: next.value[0]
            }

            next = agenda.next()

            value.duration = !next.done ? moment(next.value[0], this.format).diff(moment(value.start, this.format)) : 0
            value.nextStart = !next.done ? next.value[0] : null
            steps.push(value)
        }

        let start = {
            done: false,
            value: { duration: 0, label: 'start', start: steps[0].start }
        }

        this.doStep(start, steps[Symbol.iterator]())
    }

    doStep(current, steps) {
        if (this.intervalId) {
            clearInterval(this.intervalId)
        }

        if (current.done) {
            return this.emitter.emit('done')
        }

        let next = steps.next()
        let duration = !next.done ? moment(next.value.start, this.format).diff() : 0

        if (!next.done && moment(next.value.start, this.format) < moment()) {
            this.emitter.emit('skipStep', current)
            setTimeout(this.doStep.bind(this), 500, next, steps)
            return
        }

        this.emitter.emit('startStep', current, next)

        let ticker = (function(nextStart) {
            let now = new Date()
            nextStart = nextStart ? moment(nextStart, this.format) : now
            nextStart = nextStart - now < 0 ? now : nextStart
            this.emitter.emit('tick', nextStart - now, current)
        }).bind(this)

        this.intervalId = setInterval(ticker, this.tickLength, next.value && next.value.start)
        setTimeout(this.doStep.bind(this), duration, next, steps)
    }

    cliEmitterHandler() {
        var rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })

        this.emitter.on('startStep', function(current, next) {
            let duration = moment(moment.duration(current.value.duration)._data).format('H:mm:ss')

            notifier.notify({ title: current.value.label, message: duration, sound: 'Glass' })

            rl.write(null, { ctrl: true, name: 'u' });
            rl.write('\n')
            rl.write(`${current.value.start} -- ${current.value.label} for ${duration}\n`)

            if (!next.done) {
                rl.write(`\t(then ${next.value.label} at ${next.value.start})\n`)
            }
        })

        this.emitter.on('skipStep', function(current) {
            rl.write(`\nSKIP ${current.value.start} -- ${current.value.label}\n`)
        })

        this.emitter.on('tick', function(duration, current) {
            let _duration = moment(moment.duration(duration)._data).format('H:mm:ss')

            if (_duration != 'Invalid date') {
                duration = _duration
            } else {
                duration = JSON.stringify(duration)
            }

            rl.write(null, { ctrl: true, name: 'u' })
            rl.write(duration)

            // Set tab title
            process.stdout.write(`${String.fromCharCode(27)}]0;${duration} ${current.value.label}${String.fromCharCode(7)}`)
        })

        this.emitter.on('done', function() {
            rl.write('done')
        })
    }

    static parse(text) {
        let patterns = [
            ['doFor', /^do (.+) for (\d+) (\w+)$/i, 'label', 'count', 'units'],
            ['doUntil', /^do (.+) until (\d\d?:\d\d\s?(a|p)m)$/i, 'label', 'time'],
            ['runFor', /^run (.+) for (\d+) (\w+)$/i, 'timer', 'count', 'units'],
            ['runUntil', /^run (.+) until (\d\d?:\d\d\s?(a|p)m?)$/i, 'timer', 'time'],
            ['runTimes', /^run (.+) (\d+) times/i, 'timer', 'count']
        ]

        for (let [func, pattern, ...groups] of patterns) {
            if (!pattern.test(text)) {
                continue
            }

            let result = pattern.exec(text)

            let ret = new Map([['func', func]])
            groups.forEach((g, i) => ret.set(g, result[i + 1]))
            return ret
        }

        throw new Error(`I don't know how to parse "${text}"`)
    }
}

module.exports.TimerSchedule = TimerSchedule
