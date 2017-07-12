# TimerSchedule

_A CLI app written in Node.js._

Timebox your day without a ton of data entry, and automatically schedule
customizable pomodoro sessions between other scheduled events.

You can use it just to plan out all your timeboxes for the day, or you can use
it to run the timers for you and give you notifications. The current timer
description and remaining time is displayed in the tab title as well as the
terminal window.

_I want to call it PomoPlan, but [I can't][trademark-fever]. Suggestions
for a better name are appreciated._

### Status

This is a proof of concept for a future Electron app. It is basically
usable as a command line app (tested in iTerm2 and Apple Terminal) but there
are a few bugs you can encounter if you try to run a complicated or nonsensical
schedule.

## How do I use this?

Since it's just a prototype and not packaged in any way, you're gonna hafta
clone the repo and install the node packages. Then create your own
`schedule.yml` at the root of your clone. Here's an example to get you started:

```yaml
25/5 pomos:
  - do work for 25 minutes
  - do get up and move around for 5 minutes
normal day:
  - do catch up on email for 15 minutes
  - run 25/5 pomos until 10:30am
  - do daily stand up until 10:45am
  - run 25/5 pomos until 12:00pm
  - do lunch until 1:00pm
  - run 25/5 pomos 3 times
  - do long break for 15 minutes
  - run 25/5 pomos until 5:00pm
```

In order to run it you'll need to pass the schedule name and a start time as
command line arguments. Ex.:

```
> ./app.js "normal day" 9:00am
```

If you just want to see the schedule and not run it you can include any value
as a third argument. It would print something like this:

```
> ./app.js "normal day" 9:00am 1                                                                                                          130  16:47:25   master  ✽2
Map {
  '9:00:00 am' => 'catch up on email',
  '9:15:00 am' => 'work',
  '9:40:00 am' => 'get up and move around',
  '9:45:00 am' => 'work',
  '10:10:00 am' => 'get up and move around',
  '10:15:00 am' => 'work',
  '10:30:00 am' => 'daily stand up',
  '10:45:00 am' => 'work',
  '11:10:00 am' => 'get up and move around',
  '11:15:00 am' => 'work',
  '11:40:00 am' => 'get up and move around',
  '11:45:00 am' => 'work',
  '12:00:00 pm' => 'lunch',
  '1:00:00 pm' => 'work',
  '1:25:00 pm' => 'get up and move around',
  '1:30:00 pm' => 'work',
  '1:55:00 pm' => 'get up and move around',
  '2:00:00 pm' => 'work',
  '2:25:00 pm' => 'get up and move around',
  '2:30:00 pm' => 'long break',
  '2:45:00 pm' => 'work',
  '3:10:00 pm' => 'get up and move around',
  '3:15:00 pm' => 'work',
  '3:40:00 pm' => 'get up and move around',
  '3:45:00 pm' => 'work',
  '4:10:00 pm' => 'get up and move around',
  '4:15:00 pm' => 'work',
  '4:40:00 pm' => 'get up and move around',
  '4:45:00 pm' => 'work',
  '5:00:00 pm' => 'stop' }
```

This is useful while you are planning your schedule so you can see if it works
out to end a Pomodoro early because you scheduled some moveable other activity.
Like for example, if you had decided to do pomos until 3:00pm so you could go
make yourself an afternoon coffee, you could easily see it would be better to
make your coffee at 3:10pm.

### How do I write commands?

There are 5 types of commands:

- `do [x] until [time]`
- `do [x] for [duration]`
- `run [schedule] until [time]`
- `run [schedule] for [duration]`
- `run [schedule] [n] times`

Durations are formatted like `[number] [units]`, e.g. "10 minutes", "1 hour",
"30 seconds"... you get it. Exact times are formatted like
`[hour]:[minute][am|pm]`, as in the example yaml above.

Currently any schedule you call with `run` from another schedule can only have
`do` commands in it. This makes me unhappy.

## Notifications don't work

**Mac OS**: You have to allow "terminal-notifier" to send notifications in
System Preferences > Notifications.

**Other**: `¯\_(ツ)_/¯`

## Why did you make this?

Time management is hard. It's hard to get into the zone, and once you do it's
hard to remember to get up and move around every now and then.

Some brilliant Italian guy with [trademark-fever] solved this with the Pomodoro
Technique, which is a really simple method where you set a timer for 25
minutes, work, and when the timer goes off, you set it for 5 minutes and take a
break. Repeat.

I like the idea of the Pomomdoro Technique, but find I am seldom ready to
commit to 25 minutes of focus, so I would procrastinate even starting the
timer. If I did manage to start it, I'd have to stop it for meetings or other
activities that didn't fit exactly into a Pomodoro, then I'd have to psych
myself up for more Pomodoros again afterwards.

Another technique is scheduled time-boxing. This is where you plan your day in
advance and schedule an activity (which could very well be "relax") for every
minute of the day in little boxes of 15 or 30 minutes.

This could have been a good solution to my problem, but it was such a pain to
make a schedule like that every day. And having a big 3 hour block that just
says "Work" is a bit daunting for me – I wanted blocks like that broken up into
Pomodoros.

So what I really wanted was a combination of the two. I wanted to schedule
Pomodoro cycles in between meetings and other time-boxed activities. And I
needed to be able to start the timer at the beginning of the day and have it
loop all day so I only had to make the commmitment to start once, in the
morning.

I also needed it to be easy to create ad-hoc schedules, because every day is a
little different.

---

[trademark-fever]: https://cirillocompany.de/pages/the-pomodoro-technique-trademark-guidelines
