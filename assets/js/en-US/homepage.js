function getServers(page) {
    const params = new URLSearchParams(window.location.search);
    if (params.has('page') || page > 1) {
        params.set('page', page);
    }
    if (params.size > 0) {
        window.history.pushState({}, '', `?${params.toString()}`);
    }

    //todo: IMPORTANT set to placeholder before loading

    fetch('https://10.0.0.3/api/servers/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json ' },
        body: JSON.stringify({ page: page })
    }).then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
    }).then(data => {
        if (!data.success) throw new Error(data?.error || 'Something went wrong');

        //serversContainer
        const serversContainer = document.getElementById('serversContainer');
        serversContainer.innerHTML = '';
        if (data.data.length > 0) {
            for (let i = 0; i < data.data.length; i++) {
                const server = data.data[i];

                const card = document.createElement('div');
                card.className = `card shadow-sm rounded-4 p-4 w-100${i > 0 ? ' mt-3' : ''}`;

                const row = document.createElement('div');
                row.className = 'row';

                const leftCol = document.createElement('div');
                leftCol.className = 'col-10';

                const title = document.createElement('h5');
                title.className = 'card-title mb-2';
                title.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-server-icon lucide-server me-2"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>${server.label}`;
                leftCol.appendChild(title);

                if (server.ipv4 && server.ipv6 && (server.ipv4_display !== 'hide' || server.ipv6_display !== 'hide')) {
                    const ipsText = formText(`IPv4: {ipv4}
IPv6: {ipv6}`, { ipv4: server.ipv4, ipv6: server.ipv6 });

                    const ip = document.createElement('p');
                    ip.className = 'mb-2';
                    ip.style.whiteSpace = 'pre-line';
                    ip.textContent = ipsText;

                    leftCol.appendChild(ip);
                } else if (server.ipv4 && server.ipv4_display !== 'hide') {
                    const ipv4Text = formText(`IPv4: {ip}`, { ip: server.ipv4 });

                    const ip = document.createElement('p');
                    ip.className = 'mb-2';
                    ip.style.whiteSpace = 'pre-line';
                    ip.textContent = ipv4Text;

                    leftCol.appendChild(ip);
                } else if (server.ipv6 && server.ipv6_display !== 'hide') {
                    const ipv6Text = formText(`IPv4: {ip}`, { ip: server.ipv6 });

                    const ip = document.createElement('p');
                    ip.className = 'mb-2';
                    ip.style.whiteSpace = 'pre-line';
                    ip.textContent = ipv6Text;

                    leftCol.appendChild(ip);
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

                        leftCol.appendChild(ip);
                    } else {
                        const ipText = formText(`Hostname: {hostname}
Resolved at: Never resolved`, { hostname: server.hostname });
                        
                        const ip = document.createElement('p');
                        ip.className = 'mb-2';
                        ip.style.whiteSpace = 'pre-line';
                        ip.textContent = ipText;

                        leftCol.appendChild(ip);
                    }
                }

                if (server.live_monitoring && server.live_monitoring.enabled) {
                    if (server.live_monitoring.data) {
                        const title = document.createElement('h6');
                        title.className = 'card-title mt-2 mb-1';
                        title.textContent = `Live Monitoring:`;
                        leftCol.appendChild(title);

                        const cpuUsageP = document.createElement('p');
                        cpuUsageP.className = 'mb-0';

                        const cpuUsageI = document.createElement('i');
                        cpuUsageI.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cpu-icon lucide-cpu me-2"><path d="M12 20v2"/><path d="M12 2v2"/><path d="M17 20v2"/><path d="M17 2v2"/><path d="M2 12h2"/><path d="M2 17h2"/><path d="M2 7h2"/><path d="M20 12h2"/><path d="M20 17h2"/><path d="M20 7h2"/><path d="M7 20v2"/><path d="M7 2v2"/><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>';
                        cpuUsageP.appendChild(cpuUsageI);

                        const cpuUsageSpan = document.createElement('span');
                        cpuUsageSpan.textContent = formText(`CPU Usage: {cpu_avg}% ({samples} samples, lowest seen: {cpu_lowest}%, highest seen: {cpu_highest}%)`, { cpu_avg: server.live_monitoring.data.cpu.avg.toFixed(2), cpu_lowest: server.live_monitoring.data.cpu.min.toFixed(2), cpu_highest: server.live_monitoring.data.cpu.max.toFixed(2), samples: server.live_monitoring.data.cpu.samples.length });
                        cpuUsageP.appendChild(cpuUsageSpan);

                        leftCol.appendChild(cpuUsageP);

                        const totalMemoryMb = server.live_monitoring.data.mem.total / 1024;
                        const totalMemoryGb = totalMemoryMb / 1024;
                        if (totalMemoryMb > 1024) {
                            const usedMemoryGb = server.live_monitoring.data.mem.used / 1024/ 1024;
                            const availableMemoryGb = server.live_monitoring.data.mem.available / 1024/ 1024;

                            const memoryUsageP = document.createElement('p');
                            memoryUsageP.className = 'mb-0';

                            const memoryUsageI = document.createElement('i');
                            memoryUsageI.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-memory-stick-icon lucide-memory-stick me-2"><path d="M12 12v-2"/><path d="M12 18v-2"/><path d="M16 12v-2"/><path d="M16 18v-2"/><path d="M2 11h1.5"/><path d="M20 18v-2"/><path d="M20.5 11H22"/><path d="M4 18v-2"/><path d="M8 12v-2"/><path d="M8 18v-2"/><rect x="2" y="6" width="20" height="10" rx="2"/></svg>';
                            memoryUsageP.appendChild(memoryUsageI);

                            const memoryUsageSpan = document.createElement('span');
                            memoryUsageSpan.textContent = formText(`Memory Usage: {used}GB/{total}GB ({available}GB available)`, { used: usedMemoryGb.toFixed(1), total: totalMemoryGb.toFixed(1), available: availableMemoryGb.toFixed(1) });
                            memoryUsageP.appendChild(memoryUsageSpan);

                            leftCol.appendChild(memoryUsageP);
                        } else {
                            const usedMemoryMb = server.live_monitoring.data.mem.used / 1024;
                            const availableMemoryMb = server.live_monitoring.data.mem.available / 1024;

                            const memoryUsageP = document.createElement('p');
                            memoryUsageP.className = 'mb-0';

                            const memoryUsageI = document.createElement('i');
                            memoryUsageI.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-memory-stick-icon lucide-memory-stick me-2"><path d="M12 12v-2"/><path d="M12 18v-2"/><path d="M16 12v-2"/><path d="M16 18v-2"/><path d="M2 11h1.5"/><path d="M20 18v-2"/><path d="M20.5 11H22"/><path d="M4 18v-2"/><path d="M8 12v-2"/><path d="M8 18v-2"/><rect x="2" y="6" width="20" height="10" rx="2"/></svg>';
                            memoryUsageP.appendChild(memoryUsageI);

                            const memoryUsageSpan = document.createElement('span');
                            memoryUsageSpan.textContent = formText(`Memory Usage: {used}MB/{total}MB ({available}MB available)`, { used: usedMemoryMb.toFixed(0), total: totalMemoryMb.toFixed(0), available: availableMemoryMb.toFixed(0) });
                            memoryUsageP.appendChild(memoryUsageSpan);

                            leftCol.appendChild(memoryUsageP);
                        }

                        if (server.live_monitoring.data.disk) {
                            server.live_monitoring.data.disk.filter(disk => disk.main).forEach(disk => {
                                const diskP = document.createElement('p');
                                diskP.className = 'mb-0';

                                const diskI = document.createElement('i');
                                diskI.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hard-drive-icon lucide-hard-drive me-2"><path d="M10 16h.01"/><path d="M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><path d="M21.946 12.013H2.054"/><path d="M6 16h.01"/></svg>';
                                diskP.appendChild(diskI);

                                const diskSpan = document.createElement('span');
                                diskSpan.textContent = formText(`Disk ({mount}): {used}GB/{total}GB ({percent}% used)`, {
                                    mount: disk.mount,
                                    used: (disk.used_kb / 1024 / 1024).toFixed(2),
                                    total: (disk.total_kb / 1024 / 1024).toFixed(2),
                                    percent: disk.percent_used
                                });
                                diskP.appendChild(diskSpan);

                                leftCol.appendChild(diskP);
                            });
                        }

                        if (server.live_monitoring.data.uptime_seconds != null) {
                            const days = Math.floor(server.live_monitoring.data.uptime_seconds / 86400);
                            const hours = Math.floor((server.live_monitoring.data.uptime_seconds % 86400) / 3600);
                            const mins = Math.floor((server.live_monitoring.data.uptime_seconds % 3600) / 60);

                            const uptimeP = document.createElement('p');
                            uptimeP.className = 'mb-0';

                            const uptimeI = document.createElement('i');
                            uptimeI.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-timer-icon lucide-timer me-2"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>';
                            uptimeP.appendChild(uptimeI);

                            const uptimeSpan = document.createElement('span');
                            uptimeSpan.textContent = formText(`Uptime: {uptime}`, { uptime: `${days}d ${hours}h ${mins}m` });
                            uptimeP.appendChild(uptimeSpan);

                            leftCol.appendChild(uptimeP);
                        }

                        if (server.live_monitoring.data.last_updated_at) {
                            const lastUpdatedP = document.createElement('p');
                            lastUpdatedP.className = 'mb-0';

                            const lastUpdatedI = document.createElement('i');
                            lastUpdatedI.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-icon lucide-clock me-2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
                            lastUpdatedP.appendChild(lastUpdatedI);

                            const lastUpdatedSpan = document.createElement('span');
                            lastUpdatedSpan.textContent = formText(`Last Updated: {date}`, { date: new Date(server.live_monitoring.data.last_updated_at).toLocaleString() });
                            lastUpdatedP.appendChild(lastUpdatedSpan);

                            leftCol.appendChild(lastUpdatedP);
                        }
                    } else {
                        const noDataP = document.createElement('p');
                        noDataP.className = 'mb-0 text-muted';
                        noDataP.textContent = `Live monitoring is enabled but no data has been received yet.`;
                        leftCol.appendChild(noDataP);
                    }
                }

                const serviceAmountText = formText(`{count} services`, { count: server.services.length });
                const serviceAmount = document.createElement('p');
                serviceAmount.className = 'mt-2 mb-0';
                serviceAmount.textContent = serviceAmountText;
                leftCol.appendChild(serviceAmount);

                const rightCol = document.createElement('div');
                rightCol.className = 'col-2 d-flex justify-content-center align-items-center';

                const serverLink = document.createElement('a');
                const locale = "/en-US";
                serverLink.href = `${locale}/servers/${server.uid}`;
                serverLink.title = formText(`View {label}`, { label: server.label });

                const serverLinkArrow = document.createElement('i');
                //serverLinkArrow.className = 'text-white';
                serverLinkArrow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-arrow-right-icon lucide-circle-arrow-right"><circle cx="12" cy="12" r="10"/><path d="m12 16 4-4-4-4"/><path d="M8 12h8"/></svg>`;
                serverLink.appendChild(serverLinkArrow);

                rightCol.appendChild(serverLink);
                
                row.appendChild(leftCol);
                row.appendChild(rightCol);
                card.appendChild(row);
                serversContainer.appendChild(card);
            }
        } else {
            //todo: IMPORTANT no servers found
        }

        const serversPagination = document.getElementById('serversPagination');
        serversPagination.innerHTML = '';
        if (data.total_pages > 1) {
            const paginationNav = document.createElement('nav');
            const paginationUl = document.createElement('ul');
            paginationUl.className = 'pagination mb-0 gap-1';

            //prev button
            const prevLi = document.createElement('li');
            prevLi.className = 'page-item';
            const prevA = document.createElement('a');
            prevA.className = 'text-body d-flex align-items-center justify-content-center';
            prevA.style.cssText = 'width:38px;height:38px;cursor:pointer;';
            prevA.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;
            if (data.previous_page) prevA.onclick = () => getProducts(data.previous_page);
            else prevA.style.opacity = '0.3';
            prevLi.appendChild(prevA);
            paginationUl.appendChild(prevLi);

            //page numbers
            const cur = data.current_page;
            const total = data.total_pages;
            const pages = [];

            pages.push(1);
            if (cur - 3 > 2) pages.push('...');
            for (let i = Math.max(2, cur - 3); i <= Math.min(total - 1, cur + 3); i++) pages.push(i);
            if (cur + 3 < total - 1) pages.push('...');
            if (total > 1) pages.push(total);

            for (const p of pages) {
                const li = document.createElement('li');
                li.className = 'page-item';

                if (p === '...') {
                    li.classList.add('disabled');
                    const span = document.createElement('span');
                    span.className = 'page-link rounded-circle text-center';
                    span.style.cssText = 'width:38px;height:38px;line-height:38px;padding:0;';
                    span.textContent = '…';
                    li.appendChild(span);
                } else {
                    const a = document.createElement('a');
                    a.className = `page-link rounded-circle text-center${p === cur ? ' active' : ''}`;
                    a.style.cssText = 'width:38px;height:38px;line-height:38px;padding:0;cursor:pointer;';
                    a.textContent = p;
                    if (p !== cur) a.onclick = () => getProducts(p);
                    li.appendChild(a);
                }

                paginationUl.appendChild(li);
            }

            //next button
            const nextLi = document.createElement('li');
            nextLi.className = 'page-item';
            const nextA = document.createElement('a');
            nextA.className = 'text-body d-flex align-items-center justify-content-center';
            nextA.style.cssText = 'width:38px;height:38px;cursor:pointer;';
            nextA.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
            if (data.next_page) nextA.onclick = () => getProducts(data.next_page);
            else nextA.style.opacity = '0.3';
            nextLi.appendChild(nextA);
            paginationUl.appendChild(nextLi);

            paginationNav.appendChild(paginationUl);
            serversPagination.appendChild(paginationNav);
        }
    }).catch(error => {
        console.error('Error while getting server data:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const page = parseInt(new URLSearchParams(window.location.search).get('page'), 10) || 1;
    getServers(page);
});