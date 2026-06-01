const video = document.getElementById('comparisonVideo')

const chart = document.getElementById('retentionChart')
const cursor = document.getElementById('retentionCursor')

const timelineControlTrack =
  document.getElementById('timelineControlTrack')

const timelineExperimentTrack =
  document.getElementById('timelineExperimentTrack')

const controlIndicator =
  document.getElementById('timelineControlIndicator')

const experimentIndicator =
  document.getElementById('timelineExperimentIndicator')

const SVG_WIDTH = 1000

function updateUI(time)
{
  const duration = video.duration || 50

  const progress = time / duration

  const chartX =
    progress * SVG_WIDTH

  cursor.setAttribute(
    'x1',
    chartX
  )

  cursor.setAttribute(
    'x2',
    chartX
  )

  const percent =
    progress * 100

  controlIndicator.style.left =
    `${percent}%`

  experimentIndicator.style.left =
    `${percent}%`
}

function setCurrentTime(time)
{
  if (!video.duration)
    return

  const clamped =
    Math.max(
      0,
      Math.min(time, video.duration)
    )

  video.currentTime =
    clamped

  updateUI(clamped)
}

video.addEventListener(
  'timeupdate',
  () =>
  {
    updateUI(
      video.currentTime
    )
  }
)

video.addEventListener(
  'loadedmetadata',
  () =>
  {
    updateUI(0)
  }
)

function seekFromTrack(event, track)
{
  const rect =
    track.getBoundingClientRect()

  const progress =
    (event.clientX - rect.left)
    / rect.width

  const time =
    progress * video.duration

  setCurrentTime(time)
}

timelineControlTrack.addEventListener(
  'click',
  e =>
  {
    seekFromTrack(
      e,
      timelineControlTrack
    )
  }
)

timelineExperimentTrack.addEventListener(
  'click',
  e =>
  {
    seekFromTrack(
      e,
      timelineExperimentTrack
    )
  }
)

chart.addEventListener(
  'click',
  e =>
  {
    const rect =
      chart.getBoundingClientRect()

    const progress =
      (e.clientX - rect.left)
      / rect.width

    const time =
      progress * video.duration

    setCurrentTime(time)
  }
)