(function () {
  'use strict';

  var OUTLIER_ABS = 80;
  var MEASURED_SPEED_MIN = 80;

  var charts = {
    hitrate: null,
    hbias: null,
    vertical: null,
    speed: null,
    hittime: null
  };

  var els = {
    zone: document.getElementById('upload-zone'),
    input: document.getElementById('file-input'),
    fileBar: document.getElementById('file-bar'),
    fileName: document.getElementById('file-name'),
    fileCount: document.getElementById('file-count'),
    btnReset: document.getElementById('btn-reset'),
    btnSample: document.getElementById('btn-sample'),
    error: document.getElementById('error-box'),
    filterNote: document.getElementById('filter-note'),
    results: document.getElementById('results'),
    suggestList: document.getElementById('suggest-list'),
    paramTbody: document.getElementById('param-tbody')
  };

  function showError(msg) {
    els.error.textContent = msg;
    els.error.classList.add('visible');
  }

  function clearError() {
    els.error.textContent = '';
    els.error.classList.remove('visible');
  }

  function parseCSV(text) {
    var lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(function (l) {
      return l.trim().length > 0;
    });
    if (lines.length < 2) throw new Error('CSV 内容为空或只有表头');

    var headers = splitCSVLine(lines[0]);
    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      var cols = splitCSVLine(lines[i]);
      if (cols.length < 5) continue;
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        row[headers[j]] = cols[j] != null ? cols[j] : '';
      }
      rows.push(row);
    }
    return { headers: headers, rows: rows };
  }

  function splitCSVLine(line) {
    var result = [];
    var cur = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  }

  function num(v) {
    if (v == null || v === '') return NaN;
    var n = parseFloat(String(v).replace(/%/g, ''));
    return isNaN(n) ? NaN : n;
  }

  function parseDeviation(str) {
    var parts = String(str || '').split('/');
    return {
      d3: num(parts[0]),
      h: num(parts[1]),
      v: num(parts[2])
    };
  }

  function bandSortKey(band) {
    var m = String(band || '').match(/(-?\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 9999;
  }

  function isValidMeasuredSpeed(r) {
    return r.hit && !isNaN(r.measuredSpeed) && r.measuredSpeed >= MEASURED_SPEED_MIN;
  }

  function normalizeRows(rawRows) {
    return rawRows.map(function (r) {
      var result = String(r['结果'] || '').trim();
      var hit = result === '命中';
      var hBias = num(r['水平沿向偏差']);
      var dist = num(r['距离(m)']);
      var band = String(r['区间(m)'] || '').trim() || '未知';
      var vert = String(r['垂直方向'] || '').trim() || '未知';
      var dev = parseDeviation(r['偏差(3D/水平/垂直)']);

      var outlier = !isNaN(hBias) && Math.abs(hBias) > OUTLIER_ABS;
      if (!isNaN(dev.d3) && Math.abs(dev.d3) > OUTLIER_ABS * 2) outlier = true;

      return {
        hit: hit,
        result: result,
        dist: dist,
        band: band,
        hBias: hBias,
        vert: vert,
        horiz: num(r['水平']),
        up: num(r['上预判']),
        down: num(r['下预判']),
        speed: num(r['弹速']),
        measuredSpeed: num(r['实测弹速']),
        hitTime: num(r['命中耗时(s)']),
        d3: dev.d3,
        outlier: outlier
      };
    }).filter(function (r) {
      return r.result === '命中' || r.result === '脱靶';
    });
  }

  function mean(arr) {
    if (!arr.length) return NaN;
    var s = 0;
    for (var i = 0; i < arr.length; i++) s += arr[i];
    return s / arr.length;
  }

  function groupByBand(rows) {
    var map = {};
    rows.forEach(function (r) {
      if (!map[r.band]) map[r.band] = [];
      map[r.band].push(r);
    });
    return Object.keys(map)
      .sort(function (a, b) { return bandSortKey(a) - bandSortKey(b); })
      .map(function (band) {
        var list = map[band];
        var hits = list.filter(function (x) { return x.hit; });
        var valid = list.filter(function (x) { return !x.outlier && !isNaN(x.hBias); });
        var validHits = hits.filter(function (x) { return !x.outlier && !isNaN(x.hBias); });
        var hBiasVals = valid.map(function (x) { return x.hBias; });
        var hitDev = validHits.map(function (x) { return x.d3; }).filter(function (n) { return !isNaN(n); });
        var measured = list.filter(isValidMeasuredSpeed).map(function (x) { return x.measuredSpeed; });

        var vertCount = { 平: 0, 上升: 0, 下降: 0 };
        validHits.forEach(function (x) {
          if (vertCount[x.vert] != null) vertCount[x.vert]++;
        });

        return {
          band: band,
          total: list.length,
          hits: hits.length,
          rate: list.length ? hits.length / list.length : 0,
          horiz: modeOrMean(list.map(function (x) { return x.horiz; })),
          up: modeOrMean(list.map(function (x) { return x.up; })),
          down: modeOrMean(list.map(function (x) { return x.down; })),
          speed: modeOrMean(list.map(function (x) { return x.speed; })),
          meanMeasuredSpeed: mean(measured),
          measuredCount: measured.length,
          meanHBias: mean(hBiasVals),
          meanHitDev: mean(hitDev),
          validCount: valid.length,
          vertCount: vertCount
        };
      });
  }

  function modeOrMean(nums) {
    var clean = nums.filter(function (n) { return !isNaN(n); });
    if (!clean.length) return NaN;
    var freq = {};
    clean.forEach(function (n) {
      var k = String(n);
      freq[k] = (freq[k] || 0) + 1;
    });
    var best = clean[0];
    var bestN = 0;
    Object.keys(freq).forEach(function (k) {
      if (freq[k] > bestN) {
        bestN = freq[k];
        best = parseFloat(k);
      }
    });
    return best;
  }

  function buildSuggestions(bands) {
    return bands
      .map(function (b) {
        var tips = [];
        var level = 'ok';
        var sampleNote = b.validCount < 5 ? '（样本偏少，仅供参考）' : '';

        if (b.rate < 0.65) level = 'warn';

        if (!isNaN(b.meanHBias)) {
          if (b.meanHBias > 2.5) {
            tips.push('水平偏多（均值 +' + b.meanHBias.toFixed(1) + '），建议略降「水平」');
            level = 'warn';
          } else if (b.meanHBias < -2.5) {
            tips.push('水平偏少（均值 ' + b.meanHBias.toFixed(1) + '），建议略升「水平」');
            level = 'warn';
          } else {
            tips.push('水平偏差接近中性（' + (b.meanHBias >= 0 ? '+' : '') + b.meanHBias.toFixed(1) + '）');
          }
        } else {
          tips.push('有效水平偏差样本不足，暂无法判断水平');
          level = 'warn';
        }

        var vc = b.vertCount;
        var hitVertTotal = vc['平'] + vc['上升'] + vc['下降'];
        if (hitVertTotal >= 3) {
          var upR = vc['上升'] / hitVertTotal;
          var downR = vc['下降'] / hitVertTotal;
          if (upR >= 0.35) {
            tips.push('命中中「上升」偏多，可略减「上预判」或检查弹道抬升');
            level = 'warn';
          } else if (downR >= 0.35) {
            tips.push('命中中「下降」偏多，可略增「下预判」或检查下坠补偿');
            level = 'warn';
          } else {
            tips.push('垂直方向以「平」为主，上下预判大体正常');
          }
        }

        if (!isNaN(b.speed) && !isNaN(b.meanMeasuredSpeed) && b.measuredCount >= 2) {
          var diff = b.meanMeasuredSpeed - b.speed;
          var ratio = Math.abs(diff) / b.speed;
          if (ratio >= 0.18) {
            tips.push(
              '实测弹速均值 ' + b.meanMeasuredSpeed.toFixed(0) +
              '，与设定 ' + b.speed + ' 相差较大，建议复查弹速'
            );
            level = 'warn';
          }
        }

        if (b.rate >= 0.7 && level === 'ok') {
          tips.push('该区间命中率良好，可保持现参微调');
        } else if (b.rate < 0.5) {
          tips.push('命中率偏低，优先按偏差方向小步调参后复测');
        }

        return {
          band: b.band,
          rate: b.rate,
          total: b.total,
          level: level,
          text: tips.join('；') + sampleNote,
          params: formatParams(b)
        };
      })
      .sort(function (a, b) {
        return bandSortKey(a.band) - bandSortKey(b.band);
      });
  }

  function formatParams(b) {
    var parts = [];
    if (!isNaN(b.horiz)) parts.push('水平 ' + b.horiz);
    if (!isNaN(b.up)) parts.push('上 ' + b.up);
    if (!isNaN(b.down)) parts.push('下 ' + b.down);
    if (!isNaN(b.speed)) parts.push('弹速 ' + b.speed);
    if (!isNaN(b.meanMeasuredSpeed)) parts.push('实测≈' + b.meanMeasuredSpeed.toFixed(0));
    return parts.join(' · ') || '—';
  }

  function destroyCharts() {
    Object.keys(charts).forEach(function (k) {
      if (charts[k]) {
        charts[k].destroy();
        charts[k] = null;
      }
    });
  }

  function countFilterStats(rows) {
    var outliers = rows.filter(function (r) { return r.outlier; });
    var outlierMiss = outliers.filter(function (r) { return !r.hit; }).length;
    var outlierHit = outliers.filter(function (r) { return r.hit; }).length;
    var biasUsed = rows.filter(function (r) { return !r.outlier && !isNaN(r.hBias); }).length;
    return {
      outlierTotal: outliers.length,
      outlierMiss: outlierMiss,
      outlierHit: outlierHit,
      biasUsed: biasUsed
    };
  }

  function renderFilterNote(rows) {
    var s = countFilterStats(rows);
    if (!s.outlierTotal) {
      els.filterNote.classList.remove('visible');
      els.filterNote.innerHTML = '';
      return;
    }
    els.filterNote.innerHTML =
      '偏差分析已过滤 <strong>' + s.outlierTotal + '</strong> 条异常记录' +
      '（脱靶 ' + s.outlierMiss + ' / 命中 ' + s.outlierHit + '）。' +
      '它们仍计入总射击与命中率；当前用于偏差统计的有效样本 <strong>' + s.biasUsed + '</strong> 条。';
    els.filterNote.classList.add('visible');
  }

  function renderStats(rows, bands) {
    var hits = rows.filter(function (r) { return r.hit; }).length;
    var rate = rows.length ? hits / rows.length : 0;
    var valid = rows.filter(function (r) { return !r.outlier && !isNaN(r.hBias); });
    var validHits = rows.filter(function (r) { return r.hit && !r.outlier && !isNaN(r.d3); });
    var meanDev = mean(validHits.map(function (r) { return r.d3; }));
    var meanH = mean(valid.map(function (r) { return r.hBias; }));

    document.getElementById('stat-total').textContent = String(rows.length);
    document.getElementById('stat-bands').textContent = bands.length + ' 个距离区间';
    document.getElementById('stat-rate').textContent = (rate * 100).toFixed(1) + '%';
    document.getElementById('stat-hits').textContent = hits + ' 命中 / ' + (rows.length - hits) + ' 脱靶';
    document.getElementById('stat-dev').textContent = isNaN(meanDev) ? '—' : meanDev.toFixed(2);
    document.getElementById('stat-hbias').textContent = isNaN(meanH)
      ? '—'
      : ((meanH >= 0 ? '+' : '') + meanH.toFixed(2));
  }

  function renderHitrateChart(bands) {
    var ctx = document.getElementById('chart-hitrate');
    charts.hitrate = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bands.map(function (b) { return b.band; }),
        datasets: [{
          label: '命中率 %',
          data: bands.map(function (b) { return +(b.rate * 100).toFixed(1); }),
          backgroundColor: bands.map(function (b) {
            if (b.rate >= 0.7) return 'rgba(0, 184, 148, 0.75)';
            if (b.rate >= 0.5) return 'rgba(253, 203, 110, 0.85)';
            return 'rgba(255, 107, 107, 0.75)';
          }),
          borderRadius: 6,
          maxBarThickness: 36
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: function (ctx) {
                var b = bands[ctx.dataIndex];
                return b.hits + '/' + b.total + ' 发';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: function (v) { return v + '%'; } },
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          x: {
            ticks: { maxRotation: 45, minRotation: 0, autoSkip: true, maxTicksLimit: 16 },
            grid: { display: false }
          }
        }
      }
    });
  }

  function renderHBiasChart(rows) {
    var vals = rows
      .filter(function (r) { return !r.outlier && !isNaN(r.hBias); })
      .map(function (r) { return r.hBias; });

    var bins = buildHistogram(vals, -30, 30, 3);
    var ctx = document.getElementById('chart-hbias');
    charts.hbias = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bins.labels,
        datasets: [{
          label: '次数',
          data: bins.counts,
          backgroundColor: bins.centers.map(function (c) {
            if (Math.abs(c) < 2) return 'rgba(0, 184, 148, 0.7)';
            if (c > 0) return 'rgba(225, 112, 85, 0.65)';
            return 'rgba(15, 139, 141, 0.65)';
          }),
          borderRadius: 4,
          maxBarThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          x: {
            ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
            grid: { display: false }
          }
        }
      }
    });
  }

  function buildHistogram(vals, min, max, step) {
    var edges = [];
    for (var x = min; x < max; x += step) edges.push(x);
    var counts = edges.map(function () { return 0; });
    var under = 0;
    var over = 0;
    vals.forEach(function (v) {
      if (v < min) { under++; return; }
      if (v >= max) { over++; return; }
      var idx = Math.floor((v - min) / step);
      if (idx >= 0 && idx < counts.length) counts[idx]++;
    });
    var labels = edges.map(function (e) { return String(e); });
    if (under) {
      labels.unshift('<' + min);
      counts.unshift(under);
      edges.unshift(min - step);
    }
    if (over) {
      labels.push('≥' + max);
      counts.push(over);
      edges.push(max);
    }
    return {
      labels: labels,
      counts: counts,
      centers: edges.map(function (e) { return e + step / 2; })
    };
  }

  function renderVerticalChart(rows) {
    var counts = { 平: 0, 上升: 0, 下降: 0 };
    rows.forEach(function (r) {
      if (!r.hit || r.outlier) return;
      if (counts[r.vert] != null) counts[r.vert]++;
    });
    var labels = ['平', '上升', '下降'];
    var data = labels.map(function (k) { return counts[k]; });
    var ctx = document.getElementById('chart-vertical');
    charts.vertical = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(15, 139, 141, 0.75)',
            'rgba(253, 203, 110, 0.9)',
            'rgba(162, 155, 254, 0.8)'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 14, font: { size: 12 } }
          }
        },
        cutout: '58%'
      }
    });
  }

  function renderSpeedChart(bands) {
    var ctx = document.getElementById('chart-speed');
    charts.speed = new Chart(ctx, {
      type: 'line',
      data: {
        labels: bands.map(function (b) { return b.band; }),
        datasets: [
          {
            label: '设定弹速',
            data: bands.map(function (b) { return isNaN(b.speed) ? null : b.speed; }),
            borderColor: 'rgba(15, 139, 141, 1)',
            backgroundColor: 'rgba(15, 139, 141, 0.12)',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'rgba(15, 139, 141, 1)',
            tension: 0.25,
            spanGaps: true,
            fill: false
          },
          {
            label: '实测均值',
            data: bands.map(function (b) {
              return isNaN(b.meanMeasuredSpeed) ? null : +b.meanMeasuredSpeed.toFixed(0);
            }),
            borderColor: 'rgba(225, 112, 85, 1)',
            backgroundColor: 'rgba(225, 112, 85, 0.12)',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'rgba(225, 112, 85, 1)',
            borderDash: [6, 4],
            tension: 0.25,
            spanGaps: true,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 12, font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              afterBody: function (items) {
                if (!items.length) return '';
                var b = bands[items[0].dataIndex];
                return '有效实测样本: ' + b.measuredCount;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          x: {
            ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 12 },
            grid: { color: 'rgba(0,0,0,0.03)' }
          }
        }
      }
    });
  }

  function renderHitTimeChart(rows) {
    var vals = rows
      .filter(function (r) {
        return r.hit && !r.outlier && !isNaN(r.hitTime) && r.hitTime > 0;
      })
      .map(function (r) { return r.hitTime; });

    var bins = buildHistogram(vals, 0, 1.2, 0.1);
    // prettier labels for time
    bins.labels = bins.labels.map(function (lab) {
      if (String(lab).indexOf('<') === 0 || String(lab).indexOf('≥') === 0) return lab + 's';
      var n = parseFloat(lab);
      return isNaN(n) ? lab : n.toFixed(1) + 's';
    });

    var ctx = document.getElementById('chart-hittime');
    charts.hittime = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bins.labels,
        datasets: [{
          label: '命中次数',
          data: bins.counts,
          backgroundColor: 'rgba(108, 92, 231, 0.65)',
          borderRadius: 4,
          maxBarThickness: 26
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          x: {
            ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 10 },
            grid: { display: false }
          }
        }
      }
    });
  }

  function renderSuggestions(suggestions) {
    if (!suggestions.length) {
      els.suggestList.innerHTML = '<div class="suggest-empty">暂无区间建议</div>';
      return;
    }
    els.suggestList.innerHTML = suggestions.map(function (s) {
      return (
        '<div class="suggest-item ' + s.level + '">' +
          '<div>' +
            '<div class="suggest-band">' + escapeHtml(s.band) + 'm</div>' +
            '<div class="suggest-rate">' +
              (s.rate * 100).toFixed(0) + '% · ' + s.total + ' 发' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<div class="suggest-body">' + escapeHtml(s.text) + '</div>' +
            '<div class="suggest-params">' + escapeHtml(s.params) + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderTable(bands) {
    els.paramTbody.innerHTML = bands.map(function (b) {
      var rateCls = b.rate >= 0.7 ? 'good' : (b.rate >= 0.5 ? 'mid' : 'bad');
      var hBias = isNaN(b.meanHBias)
        ? '—'
        : ((b.meanHBias >= 0 ? '+' : '') + b.meanHBias.toFixed(1));
      var measured = isNaN(b.meanMeasuredSpeed) ? '—' : b.meanMeasuredSpeed.toFixed(0);
      return (
        '<tr>' +
          '<td><strong>' + escapeHtml(b.band) + '</strong></td>' +
          '<td>' + b.total + '</td>' +
          '<td><span class="rate-pill ' + rateCls + '">' + (b.rate * 100).toFixed(0) + '%</span></td>' +
          '<td>' + fmt(b.horiz) + '</td>' +
          '<td>' + fmt(b.up) + '</td>' +
          '<td>' + fmt(b.down) + '</td>' +
          '<td>' + fmt(b.speed) + '</td>' +
          '<td>' + measured + '</td>' +
          '<td>' + hBias + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function fmt(n) {
    return isNaN(n) ? '—' : String(n);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function analyze(text, fileName) {
    clearError();
    destroyCharts();

    var parsed;
    try {
      parsed = parseCSV(text);
    } catch (e) {
      showError(e.message || 'CSV 解析失败');
      return;
    }

    var required = ['结果', '区间(m)', '水平沿向偏差'];
    var missing = required.filter(function (h) {
      return parsed.headers.indexOf(h) === -1;
    });
    if (missing.length) {
      showError('缺少必要列：' + missing.join('、') + '。请确认是射击记录导出文件。');
      return;
    }

    var rows = normalizeRows(parsed.rows);
    if (!rows.length) {
      showError('未识别到有效射击记录（需要「命中/脱靶」结果列）。');
      return;
    }

    var bands = groupByBand(rows);
    var suggestions = buildSuggestions(bands);
    var filterStats = countFilterStats(rows);

    els.fileName.textContent = fileName || 'shot_records.csv';
    els.fileCount.textContent =
      '已解析 ' + rows.length + ' 条 · ' + bands.length + ' 个区间' +
      (filterStats.outlierTotal ? ' · 过滤异常 ' + filterStats.outlierTotal + ' 条' : '');
    els.fileBar.classList.add('visible');
    els.results.classList.add('visible');

    renderStats(rows, bands);
    renderFilterNote(rows);
    renderHitrateChart(bands);
    renderHBiasChart(rows);
    renderVerticalChart(rows);
    renderSpeedChart(bands);
    renderHitTimeChart(rows);
    renderSuggestions(suggestions);
    renderTable(bands);

    els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleFile(file) {
    if (!file) return;
    var name = file.name || '';
    if (!/\.csv$/i.test(name) && file.type && file.type.indexOf('csv') === -1 && file.type !== 'text/plain') {
      showError('请上传 CSV 文件');
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      analyze(String(reader.result || ''), name);
    };
    reader.onerror = function () {
      showError('读取文件失败，请重试');
    };
    reader.readAsText(file, 'UTF-8');
  }

  function loadSample() {
    if (!els.btnSample) return;
    var text = typeof window.TUNING_SAMPLE_CSV === 'string' ? window.TUNING_SAMPLE_CSV : '';
    if (!text) {
      showError('示例数据未加载，请刷新页面后重试，或手动上传 CSV');
      return;
    }
    clearError();
    analyze(text, '示例 shot_records.csv');
  }

  function resetAll() {
    clearError();
    destroyCharts();
    els.input.value = '';
    els.fileBar.classList.remove('visible');
    els.results.classList.remove('visible');
    els.filterNote.classList.remove('visible');
    els.filterNote.innerHTML = '';
    els.suggestList.innerHTML = '';
    els.paramTbody.innerHTML = '';
  }

  // Events
  els.zone.addEventListener('click', function () {
    els.input.click();
  });
  els.zone.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      els.input.click();
    }
  });
  els.input.addEventListener('change', function () {
    if (els.input.files && els.input.files[0]) handleFile(els.input.files[0]);
  });

  ['dragenter', 'dragover'].forEach(function (ev) {
    els.zone.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      els.zone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    els.zone.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      els.zone.classList.remove('dragover');
    });
  });
  els.zone.addEventListener('drop', function (e) {
    var files = e.dataTransfer && e.dataTransfer.files;
    if (files && files[0]) handleFile(files[0]);
  });

  els.btnReset.addEventListener('click', resetAll);
  if (els.btnSample) {
    els.btnSample.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      loadSample();
    });
  }
})();
