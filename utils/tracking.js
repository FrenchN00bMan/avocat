const fs = require('fs/promises');
const path = require('path');

const trackingPath = path.join(__dirname, '..', 'config', 'tracking.json');
const defaultTracking = {
  ga4MeasurementId: '',
  headScripts: '',
  bodyStartScripts: ''
};

async function getTrackingSettings() {
  try {
    const raw = await fs.readFile(trackingPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...defaultTracking,
      ...parsed
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { ...defaultTracking };
    }

    throw error;
  }
}

async function saveTrackingSettings(input) {
  const next = {
    ga4MeasurementId: String(input.ga4MeasurementId || '').trim(),
    headScripts: String(input.headScripts || '').trim(),
    bodyStartScripts: String(input.bodyStartScripts || '').trim()
  };

  await fs.writeFile(trackingPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}

module.exports = {
  getTrackingSettings,
  saveTrackingSettings
};
