function uptimeColour(uptime) {
    uptime = Math.max(0, Math.min(100, uptime));
    let r = 0, g = 0, b = 0;
    if (uptime < 50) {
        r = 255;
        g = Math.round(255 * (uptime / 50));
    } else {
        g = 200;
        r = Math.round(255 * (1 - (uptime - 50) / 50));
    }
    return `rgb(${r}, ${g}, ${b})`;
}

function renderResponseChart(serviceId, logs, lastStatus) {
    const bar = document.getElementById(`bar-${serviceId}`);
    if (!bar) return;

    const existingWrapper = document.getElementById(`chart-wrapper-${serviceId}`);
    if (existingWrapper) existingWrapper.remove();

    const wrapper = document.createElement('div');
    wrapper.id = `chart-wrapper-${serviceId}`;
    wrapper.style.cssText = 'width:100%;height:80px;margin-top:12px;position:relative';

    const canvas = document.createElement('canvas');
    canvas.id = `chart-${serviceId}`;
    wrapper.appendChild(canvas);
    bar.insertAdjacentElement('afterend', wrapper);

    const labels = [];
    const avgData = [];
    const downBands = [];

    const slice = logs.slice(-100);
    for (let x = Math.min(slice.length - 1, 99); x >= 0; x--) {
        const group = slice[x];
        const date = new Date(group.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const dayLogs = typeof group.logs === 'string' ? JSON.parse(group.logs) : group.logs;

        const upLogs = dayLogs.filter(l => l.status === 'up' && l.response_ms != null);
        const avg = upLogs.length > 0
            ? Math.round(upLogs.reduce((sum, l) => sum + l.response_ms, 0) / upLogs.length)
            : null;

        const hasDown = dayLogs.some(l => l.status === 'down');

        labels.push(date);
        avgData.push(avg);
        if (hasDown) downBands.push(labels.length - 1);
    }

    const lineColor = lastStatus === 'up' ? '#1D9E75' : '#dc3545';
    const fillColor = lastStatus === 'up' ? 'rgba(29,158,117,0.08)' : 'rgba(220,53,69,0.08)';

    new Chart(canvas, {
        type: 'line',
        plugins: [],
        data: {
            labels,
            datasets: [{
                data: avgData,
                borderColor: lineColor,
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 3,
                tension: 0.4,
                spanGaps: false,
                fill: true,
                backgroundColor: fillColor
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ctx.parsed.y != null ?
                            ctx.parsed.y >= 1000 ?
                                formText(`Avg: {avg}s`, { avg: (ctx.parsed.y / 1000).toFixed(2) }) :
                                formText(`Avg: {avg}ms`, { avg: ctx.parsed.y }) :
                            `No data`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { maxTicksLimit: 6, font: { size: 11 } },
                    grid: { display: false }
                },
                y: {
                    min: 0,
                    ticks: {
                        maxTicksLimit: 3,
                        font: { size: 11 },
                        callback: v => v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms`
                    },
                    grid: { color: 'rgba(128,128,128,0.1)' }
                }
            }
        }
    });
}

function renderServiceLogs(serviceId, data, lastStatus) {
    const bar = document.getElementById(`bar-${serviceId}`);
    const footer = document.getElementById(`footer-${serviceId}`);
    if (!bar || !footer) return;

    const logs = data.data;

    const upLogs = logs.flatMap(d => d.logs).filter(l => l.status === 'up');
    const downLogs = logs.flatMap(d => d.logs).filter(l => l.status === 'down');
    const total = upLogs.length + downLogs.length;
    const uptime = total > 0 ? Math.round((upLogs.length / total) * 10000) / 100 : 0;

    bar.className = 'd-flex gap-1';
    bar.innerHTML = '';

    const slice = logs.slice(-100);
    for (let x = Math.min(slice.length - 1, 99); x >= 0; x--) {
        const group = slice[x];
        const dayLogs = typeof group.logs === 'string' ? JSON.parse(group.logs) : group.logs;
        const dayUp = dayLogs.filter(l => l.status === 'up');
        const dayDown = dayLogs.filter(l => l.status === 'down');
        const dayTotal = dayUp.length + dayDown.length;
        const dayUptime = dayTotal > 0 ? Math.round((dayUp.length / dayTotal) * 10000) / 100 : 0;
        const colour = uptimeColour(dayUptime);

        const box = document.createElement('div');
        box.className = 'status-box rounded-1';
        box.style.cssText = `width:8px;height:20px;background:${colour};cursor:pointer`;

        new bootstrap.Popover(box, {
            trigger: 'hover focus',
            html: true,
            content: () => buildPopoverContent(group, dayUptime, dayDown),
            title: new Date(group.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        });
        bar.appendChild(box);
    }

    footer.className = 'mt-2';
    footer.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'mb-0 small text-muted';
    p.textContent = formText(`{percentage}% uptime`, { percentage: uptime });
    footer.appendChild(p);
    
    renderResponseChart(serviceId, logs, lastStatus);
}

function buildPopoverContent(group, dayUptime, dayDown) {
    const dayLogs = typeof group.logs === 'string' ? JSON.parse(group.logs) : group.logs;
    const date = new Date(group.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const popoverText = formText(`{date}
{percentage}% uptime
{samples} total samples`, { date: date, percentage: dayUptime, samples: dayLogs.length });

    const wrapper = document.createElement('div');

    const textEl = document.createElement('div');
    textEl.className = 'mb-0';
    textEl.style.whiteSpace = 'pre-line';
    textEl.textContent = popoverText;
    wrapper.appendChild(textEl);

    if (dayDown.length > 0) {
        const offlineP = document.createElement('p');
        offlineP.className = 'mb-1';
        offlineP.textContent = formText(`{samples} offline samples`, { samples: dayDown.length });
        wrapper.appendChild(offlineP);

        const outagesLabel = document.createElement('p');
        outagesLabel.className = 'mb-0 fw-bold';
        outagesLabel.textContent = `Outages:`;
        wrapper.appendChild(outagesLabel);

        const sorted = [...dayLogs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const outages = [];
        let open = null;
        for (const log of sorted) {
            if (log.status === 'down') {
                if (!open) open = { start: new Date(log.created_at) };
            } else if (log.status === 'up' && open) {
                open.end = new Date(log.created_at);
                outages.push(open);
                open = null;
            }
        }
        if (open) outages.push(open);

        for (const outage of outages) {
            const start = outage.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const p = document.createElement('p');
            p.className = 'mb-0';
            if (outage.end) {
                const end = outage.end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                p.textContent = formText(`At {start} - ${end}`, { start: start, end: end });
            } else {
                p.textContent = formText(`At ${start} - hasn't recovered`, { start: start });
                wrapper.appendChild(p);
                break;
            }
            wrapper.appendChild(p);
        }
    }

    return wrapper;
}

function getServiceLogData(serverId, serviceId, lastStatus) {
    fetch(`https://10.0.0.3/api/servers/get/${serverId}/service/${serviceId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }).then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
    }).then(data => {
        if (!data.success) throw new Error(data?.error || 'Something went wrong');
        renderServiceLogs(serviceId, data.data, lastStatus);
    }).catch(error => {
        console.error('Error while getting service log data:', error);
    });
}

function getServerData(serverId) {
    const serverTitleContainer = document.getElementById('serverTitleContainer');
    const serverInfoContainer = document.getElementById('serverInfoContainer');
    const liveInfoContainer = document.getElementById('liveInfoContainer');
    const serviceContainer = document.getElementById('serviceContainer');

    serverTitleContainer.className = 'mb-4 placeholder-glow';
    serverTitleContainer.innerHTML = `<h2 class="fw-bold mb-1"><span class="placeholder col-4 rounded-3"></span></h2>
<p class="text-muted mb-0"><span class="placeholder col-6 rounded-3"></span></p>`;

    serverInfoContainer.innerHTML = `<h6 class="fw-semibold mb-3 placeholder-glow"><span class="placeholder col-3 rounded-3"></span></h6>
<div class="placeholder-glow d-flex flex-column gap-2">
    <span class="placeholder col-5 rounded-3"></span>
    <span class="placeholder col-4 rounded-3"></span>
    <span class="placeholder col-3 rounded-3"></span>
</div>`;

    liveInfoContainer.innerHTML = `<h6 class="fw-semibold mb-3 placeholder-glow"><span class="placeholder col-3 rounded-3"></span></h6>
<div class="row g-3">
    <div class="col-12 col-md-4">
        <div class="placeholder-glow d-flex flex-column gap-2">
            <span class="placeholder col-6 rounded-3"></span>
            <span class="placeholder col-8 rounded-3" style="height:8px;"></span>
            <span class="placeholder col-4 rounded-3"></span>
        </div>
    </div>
    <div class="col-12 col-md-4">
        <div class="placeholder-glow d-flex flex-column gap-2">
            <span class="placeholder col-6 rounded-3"></span>
            <span class="placeholder col-8 rounded-3" style="height:8px;"></span>
            <span class="placeholder col-4 rounded-3"></span>
        </div>
    </div>
    <div class="col-12 col-md-4">
        <div class="placeholder-glow d-flex flex-column gap-2">
            <span class="placeholder col-6 rounded-3"></span>
            <span class="placeholder col-8 rounded-3" style="height:8px;"></span>
            <span class="placeholder col-4 rounded-3"></span>
        </div>
    </div>
</div>`;

    serviceContainer.innerHTML = `
<div class="card border-0 shadow-sm rounded-3 p-4 mb-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="fw-semibold mb-0 placeholder-glow"><span class="placeholder col-3 rounded-3"></span></h6>
        <span class="placeholder col-1 rounded-pill" style="height:24px;"></span>
    </div>
    <div class="placeholder-glow d-flex flex-column gap-2 mb-3">
        <span class="placeholder col-4 rounded-3"></span>
        <span class="placeholder col-3 rounded-3"></span>
    </div>
    <div class="placeholder-glow d-flex gap-1">
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
    </div>
    <div class="mt-2 placeholder-glow">
        <span class="placeholder col-2 rounded-3"></span>
    </div>
</div>

<div class="card border-0 shadow-sm rounded-3 p-4 mb-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="fw-semibold mb-0 placeholder-glow"><span class="placeholder col-3 rounded-3"></span></h6>
        <span class="placeholder col-1 rounded-pill" style="height:24px;"></span>
    </div>
    <div class="placeholder-glow d-flex flex-column gap-2 mb-3">
        <span class="placeholder col-4 rounded-3"></span>
        <span class="placeholder col-3 rounded-3"></span>
    </div>
    <div class="placeholder-glow d-flex gap-1">
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
    </div>
    <div class="mt-2 placeholder-glow">
        <span class="placeholder col-2 rounded-3"></span>
    </div>
</div>

<div class="card border-0 shadow-sm rounded-3 p-4 mb-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="fw-semibold mb-0 placeholder-glow"><span class="placeholder col-3 rounded-3"></span></h6>
        <span class="placeholder col-1 rounded-pill" style="height:24px;"></span>
    </div>
    <div class="placeholder-glow d-flex flex-column gap-2 mb-3">
        <span class="placeholder col-4 rounded-3"></span>
        <span class="placeholder col-3 rounded-3"></span>
    </div>
    <div class="placeholder-glow d-flex gap-1">
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
        <span class="placeholder rounded-1" style="width:8px;height:20px;"></span>
        
    </div>
    <div class="mt-2 placeholder-glow">
        <span class="placeholder col-2 rounded-3"></span>
    </div>
</div>
`;

    fetch(`https://10.0.0.3/api/servers/get/${serverId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json ' }
    }).then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
    }).then(data => {
        if (!data.success) throw new Error(data?.error || 'Something went wrong');

        const server = data.data;

        serverTitleContainer.className = 'mb-4';
        serverTitleContainer.innerHTML = '';

        const serverTitle = document.createElement('h2');
        serverTitle.className = 'fw-bold mb-1';
        serverTitle.textContent = `Status Monitor`;
        serverTitleContainer.appendChild(serverTitle);

        const serverTitleDesc = document.createElement('p');
        serverTitleDesc.className = 'text-muted mb-0';
        serverTitleDesc.style.whiteSpace = 'pre-line';
        serverTitleDesc.textContent = formText(`Viewing "{label}" server status`, { label: server.label });
        serverTitleContainer.appendChild(serverTitleDesc);

        serverInfoContainer.innerHTML = '';

        const serverInfoTitle = document.createElement('h6');
        serverInfoTitle.className = 'fw-semibold mb-3';
        serverInfoTitle.textContent = `Server Information`;
        serverInfoContainer.appendChild(serverInfoTitle);
        
        if (server.ipv4 && server.ipv6 && (server.ipv4_display !== 'hide' || server.ipv6_display !== 'hide')) {
            const ipsText = formText(`IPv4: {ipv4}
IPv6: {ipv6}`, { ipv4: server.ipv4, ipv6: server.ipv6 });

            const ip = document.createElement('p');
            ip.className = 'mb-2';
            ip.style.whiteSpace = 'pre-line';
            ip.textContent = ipsText;

            serverInfoContainer.appendChild(ip);
        } else if (server.ipv4 && server.ipv4_display !== 'hide') {
            const ipv4Text = formText(`IPv4: {ip}`, { ip: server.ipv4 });

            const ip = document.createElement('p');
            ip.className = 'mb-2';
            ip.style.whiteSpace = 'pre-line';
            ip.textContent = ipv4Text;

            serverInfoContainer.appendChild(ip);
        } else if (server.ipv6 && server.ipv6_display !== 'hide') {
            const ipv6Text = formText(`IPv4: {ip}`, { ip: server.ipv6 });

            const ip = document.createElement('p');
            ip.className = 'mb-2';
            ip.style.whiteSpace = 'pre-line';
            ip.textContent = ipv6Text;

            serverInfoContainer.appendChild(ip);
        } else if (server.hostname && server.hostname_display !== 'hide') {
            if (server.last_resolved_ip && server.last_resolved_at) {
                const resolvedAt = new Date(server.last_resolved_at).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }); 

                const ipText = formText(`Hostname: {hostname}
Last resolved to: {ip}
Resolved at: {date}`, {
                    hostname: server.hostname,
                    ip: server.last_resolved_ip,
                    date: resolvedAt
                });

                const ip = document.createElement('p');
                ip.className = 'mb-2';
                ip.style.whiteSpace = 'pre-line';
                ip.textContent = ipText;

                serverInfoContainer.appendChild(ip);
            } else {
                const ipText = formText(`Hostname: {hostname}
Resolved at: Never resolved`, { hostname: server.hostname });
                
                const ip = document.createElement('p');
                ip.className = 'mb-2';
                ip.style.whiteSpace = 'pre-line';
                ip.textContent = ipText;

                serverInfoContainer.appendChild(ip);
            }
        }

        liveInfoContainer.innerHTML = '';

        if (server.live_monitoring && server.live_monitoring.enabled) {
            liveInfoContainer.classList.remove('d-none');

            if (server.live_monitoring.data) {
                const title = document.createElement('h6');
                title.className = 'card-title mt-2 mb-1';
                title.textContent = `Live Monitoring`;
                liveInfoContainer.appendChild(title);

                const cpuUsageP = document.createElement('p');
                cpuUsageP.className = 'mb-0';

                const cpuUsageI = document.createElement('i');
                cpuUsageI.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cpu-icon lucide-cpu me-2"><path d="M12 20v2"/><path d="M12 2v2"/><path d="M17 20v2"/><path d="M17 2v2"/><path d="M2 12h2"/><path d="M2 17h2"/><path d="M2 7h2"/><path d="M20 12h2"/><path d="M20 17h2"/><path d="M20 7h2"/><path d="M7 20v2"/><path d="M7 2v2"/><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>';
                cpuUsageP.appendChild(cpuUsageI);

                const cpuUsageSpan = document.createElement('span');
                cpuUsageSpan.textContent = formText(`CPU Usage: {cpu_avg}% ({samples} samples, lowest seen: {cpu_lowest}%, highest seen: {cpu_highest}%)`, { cpu_avg: server.live_monitoring.data.cpu.avg.toFixed(2), cpu_lowest: server.live_monitoring.data.cpu.min.toFixed(2), cpu_highest: server.live_monitoring.data.cpu.max.toFixed(2), samples: server.live_monitoring.data.cpu.samples.length });
                cpuUsageP.appendChild(cpuUsageSpan);

                liveInfoContainer.appendChild(cpuUsageP);

                const totalMemoryMb = server.live_monitoring.data.mem.total / 1024;
                const totalMemoryGb = totalMemoryMb / 1024;
                if (totalMemoryMb > 1024) {
                    const usedMemoryGb = server.live_monitoring.data.mem.used / 1024/ 1024;
                    const availableMemoryGb = server.live_monitoring.data.mem.available / 1024/ 1024;

                    const memoryUsageP = document.createElement('p');
                    memoryUsageP.className = 'mb-0';

                    const memoryUsageI = document.createElement('i');
                    memoryUsageI.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-memory-stick-icon lucide-memory-stick me-2"><path d="M12 12v-2"/><path d="M12 18v-2"/><path d="M16 12v-2"/><path d="M16 18v-2"/><path d="M2 11h1.5"/><path d="M20 18v-2"/><path d="M20.5 11H22"/><path d="M4 18v-2"/><path d="M8 12v-2"/><path d="M8 18v-2"/><rect x="2" y="6" width="20" height="10" rx="2"/></svg>';
                    memoryUsageP.appendChild(memoryUsageI);

                    const memoryUsageSpan = document.createElement('span');
                    memoryUsageSpan.textContent = formText(`Memory Usage: {used}GB/{total}GB ({available}GB available)`, { used: usedMemoryGb.toFixed(1), total: totalMemoryGb.toFixed(1), available: availableMemoryGb.toFixed(1) });
                    memoryUsageP.appendChild(memoryUsageSpan);

                    liveInfoContainer.appendChild(memoryUsageP);
                } else {
                    const usedMemoryMb = server.live_monitoring.data.mem.used / 1024;
                    const availableMemoryMb = server.live_monitoring.data.mem.available / 1024;

                    const memoryUsageP = document.createElement('p');
                    memoryUsageP.className = 'mb-0';

                    const memoryUsageI = document.createElement('i');
                    memoryUsageI.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-memory-stick-icon lucide-memory-stick me-2"><path d="M12 12v-2"/><path d="M12 18v-2"/><path d="M16 12v-2"/><path d="M16 18v-2"/><path d="M2 11h1.5"/><path d="M20 18v-2"/><path d="M20.5 11H22"/><path d="M4 18v-2"/><path d="M8 12v-2"/><path d="M8 18v-2"/><rect x="2" y="6" width="20" height="10" rx="2"/></svg>';
                    memoryUsageP.appendChild(memoryUsageI);

                    const memoryUsageSpan = document.createElement('span');
                    memoryUsageSpan.textContent = formText(`Memory Usage: {used}MB/{total}MB ({available}MB available)`, { used: usedMemoryMb.toFixed(0), total: totalMemoryMb.toFixed(0), available: availableMemoryMb.toFixed(0) });
                    memoryUsageP.appendChild(memoryUsageSpan);

                    liveInfoContainer.appendChild(memoryUsageP);
                }

                //todo: disk usage
                console.log(server.live_monitoring.data);

                //todo: uptime

                //todo: last updated
                
            } else {
                //todo: no data found
            }
        } else {
            liveInfoContainer.classList.add('d-none');
        }

        serviceContainer.innerHTML = '';
        for (const service of data.data.services) {
            const card = document.createElement('div');
            card.className = 'card border-0 shadow-sm rounded-3 p-4 mb-3';

            const header = document.createElement('div');
            header.className = 'd-flex justify-content-between align-items-center mb-3';

            const serviceTitle = document.createElement('h6');
            serviceTitle.className = 'fw-semibold mb-0';
            serviceTitle.textContent = service.label;
            
            const statusMap = {
                up: { label: `Operational`, cls: 'text-bg-success' },
                down: { label: `Down`, cls: 'text-bg-danger' }
            };
            const s = statusMap[service.last_status] ?? { label: service.last_status, cls: 'text-bg-secondary' };
            const badge = document.createElement('span');
            badge.className = `badge rounded-pill ${s.cls}`;
            badge.textContent = s.label;

            header.appendChild(serviceTitle);
            header.appendChild(badge);
            card.appendChild(header);

            const metaWrap = document.createElement('div');
            metaWrap.className = 'd-flex flex-column gap-2 mb-3';

            const changed = new Date(service.last_status_change);
            const metaSince = document.createElement('p');
            metaSince.className = 'text-muted small mb-0';
            metaSince.textContent = formText(`Last updated: {date}`, { date: changed.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) });

            metaWrap.appendChild(metaSince);
            card.appendChild(metaWrap);

            const bar = document.createElement('div');
            bar.id = `bar-${service.uid}`;
            bar.className = 'placeholder-glow d-flex gap-1';
            for (let j = 0; j < 30; j++) {
                const tick = document.createElement('span');
                tick.className = 'placeholder rounded-1';
                tick.style.cssText = 'width:8px;height:20px';
                bar.appendChild(tick);
            }
            card.appendChild(bar);

            const footer = document.createElement('div');
            footer.id = 'footer-' + service.uid;
            footer.className = 'placeholder-glow mt-2';
            const fp = document.createElement('span');
            fp.className = 'placeholder rounded-3 col-2';
            footer.appendChild(fp);
            card.appendChild(footer);

            serviceContainer.appendChild(card);
            getServiceLogData(serverId, service.uid, service.last_status);
        }
    }).catch(error => {
        console.error('Error while getting server data:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const segments = new URL(window.location.href).pathname.split('/').filter(Boolean);
    const serverId = segments[2]; 
    getServerData(serverId);
});