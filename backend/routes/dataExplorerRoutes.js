const express = require('express');
const router = express.Router();
const { dbAll } = require('../db/database');

// GET /api/data/tables - List all tables and row counts in JSON
router.get('/api/data/tables', async (req, res) => {
  try {
    const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC");
    const summary = [];
    for (const t of tables) {
      const cnt = await dbAll(`SELECT COUNT(*) as c FROM "${t.name}"`);
      summary.push({ name: t.name, count: cnt[0].c });
    }
    res.json({ success: true, database: 'dhuan.sqlite', tables: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/data/table/:name - Get columns and rows for a specific table
router.get('/api/data/table/:name', async (req, res) => {
  try {
    const tableName = req.params.name;
    const validTables = await dbAll("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const exists = validTables.some(t => t.name === tableName);
    if (!exists) {
      return res.status(404).json({ success: false, error: `Table '${tableName}' does not exist.` });
    }
    const cols = await dbAll(`PRAGMA table_info("${tableName}")`);
    const rows = await dbAll(`SELECT * FROM "${tableName}" LIMIT 200`);
    res.json({
      success: true,
      table: tableName,
      columns: cols.map(c => ({ name: c.name, type: c.type, pk: c.pk === 1 })),
      count: rows.length,
      rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// HTML Data Explorer Page
router.get(['/data', '/explorer'], async (req, res) => {
  try {
    const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC");
    const summary = [];
    for (const t of tables) {
      const cnt = await dbAll(`SELECT COUNT(*) as c FROM "${t.name}"`);
      summary.push({ name: t.name, count: cnt[0].c });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DHUAN Backend — Database & API Data Explorer</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🗄️</text></svg>">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: #10b981;
      color: #042f2e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 900;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: #ffffff;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 700;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn {
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 800;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-emerald {
      background: #10b981;
      color: #042f2e;
    }
    .btn-emerald:hover { background: #34d399; }
    .btn-slate {
      background: #1e293b;
      color: #cbd5e1;
      border-color: #334155;
    }
    .btn-slate:hover { background: #334155; color: #ffffff; }

    .main-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Sidebar */
    .sidebar {
      width: 280px;
      background: #0f172a;
      border-right: 1px solid #1e293b;
      padding: 20px 14px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow-y: auto;
      height: calc(100vh - 73px);
    }
    .sidebar-section-title {
      font-size: 10px;
      font-weight: 900;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding-left: 8px;
      margin-bottom: 8px;
    }
    .table-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .table-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 12px;
      border-radius: 10px;
      color: #94a3b8;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
      border: 1px solid transparent;
    }
    .table-item:hover {
      background: #1e293b;
      color: #ffffff;
    }
    .table-item.active {
      background: #10b98118;
      border-color: #10b98155;
      color: #34d399;
      font-weight: 800;
    }
    .count-badge {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 9999px;
      background: #1e293b;
      color: #94a3b8;
      font-weight: 800;
    }
    .table-item.active .count-badge {
      background: #10b981;
      color: #042f2e;
    }

    /* Content Area */
    .content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      height: calc(100vh - 73px);
      background: #090d16;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .top-toolbar {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }
    .table-heading {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .table-heading h2 {
      font-size: 18px;
      font-weight: 900;
      color: #ffffff;
      font-family: monospace;
    }
    .table-heading .pill {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 9px;
      border-radius: 8px;
      background: #1e293b;
      border: 1px solid #334155;
      color: #cbd5e1;
    }

    .search-box {
      position: relative;
      width: 260px;
    }
    .search-input {
      width: 100%;
      padding: 8px 12px 8px 32px;
      background: #090d16;
      border: 1px solid #334155;
      border-radius: 10px;
      color: #f8fafc;
      font-size: 12px;
      font-weight: 700;
      outline: none;
    }
    .search-input:focus {
      border-color: #10b981;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      color: #64748b;
    }

    /* Table Container */
    .table-container {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .table-scroll {
      overflow-x: auto;
      max-height: calc(100vh - 220px);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 12px;
    }
    th {
      background: #1e293b;
      color: #94a3b8;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 12px 14px;
      border-bottom: 1px solid #334155;
      position: sticky;
      top: 0;
      white-space: nowrap;
      z-index: 10;
    }
    td {
      padding: 11px 14px;
      border-bottom: 1px solid #1e293b88;
      color: #cbd5e1;
      white-space: nowrap;
      max-width: 320px;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: -apple-system, sans-serif;
    }
    tr:hover td {
      background: #1e293b44;
      color: #ffffff;
    }

    .cell-number {
      font-family: monospace;
      font-weight: 800;
      color: #38bdf8;
    }
    .cell-id {
      font-family: monospace;
      font-size: 11px;
      color: #94a3b8;
    }
    .cell-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
      background: #1e293b;
      color: #cbd5e1;
    }

    .raw-view {
      display: none;
      padding: 20px;
      background: #090d16;
      border-radius: 12px;
      overflow: auto;
      font-family: monospace;
      font-size: 12px;
      color: #34d399;
      white-space: pre-wrap;
      max-height: calc(100vh - 220px);
    }

    .empty-state {
      padding: 48px 24px;
      text-align: center;
      color: #64748b;
      font-size: 13px;
    }

    /* Modal for row detail */
    #detailModal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      z-index: 100;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-box {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      max-width: 650px;
      width: 100%;
      padding: 24px;
      max-height: 85vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-pre {
      background: #090d16;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px;
      color: #38bdf8;
      font-family: monospace;
      font-size: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <div class="logo-badge">🗄️</div>
      <div>
        <div class="brand-title">DHUAN SQLite Database & API Explorer</div>
        <div class="brand-sub">Direct Live Inspection of Backend Memory, Tables & Records</div>
      </div>
    </div>
    <div class="header-actions">
      <a href="/api/dashboard/overview" target="_blank" class="btn btn-slate">
        🌐 Overview API
      </a>
      <a href="/api/routing/destinations?day=all" target="_blank" class="btn btn-slate">
        🗺️ Routing API
      </a>
      <a href="http://localhost:3000/dashboard" target="_blank" class="btn btn-emerald">
        Open Web App &rarr;
      </a>
    </div>
  </header>

  <div class="main-layout">
    <!-- Sidebar with Tables -->
    <div class="sidebar">
      <div>
        <div class="sidebar-section-title">SQLite Tables (${summary.length})</div>
        <div class="table-list" id="tableList">
          ${summary.map((t, idx) => `
            <div class="table-item ${idx === 0 ? 'active' : ''}" onclick="loadTable('${t.name}')" id="tab-${t.name}">
              <span>${t.name}</span>
              <span class="count-badge">${t.count}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-top: auto; padding-top: 16px; border-top: 1px solid #1e293b;">
        <div class="sidebar-section-title">Direct API Links</div>
        <div class="table-list">
          <a href="/api/health" target="_blank" class="table-item" style="text-decoration:none;">
            <span>/api/health</span>
            <span>&nearr;</span>
          </a>
          <a href="/api/dashboard/overview" target="_blank" class="table-item" style="text-decoration:none;">
            <span>/api/dashboard/overview</span>
            <span>&nearr;</span>
          </a>
          <a href="/api/routing/destinations?day=all" target="_blank" class="table-item" style="text-decoration:none;">
            <span>/api/routing/destinations</span>
            <span>&nearr;</span>
          </a>
          <a href="/api/emergency/hospitals?lat=31.5204&lng=74.3587" target="_blank" class="table-item" style="text-decoration:none;">
            <span>/api/emergency/hospitals</span>
            <span>&nearr;</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Main Content Table Viewer -->
    <div class="content">
      <div class="top-toolbar">
        <div class="table-heading">
          <h2 id="currentTableName">Loading...</h2>
          <span class="pill" id="rowCountPill">0 rows</span>
        </div>
        <div style="display:flex; align-items:center; gap: 10px;">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="searchInput" class="search-input" placeholder="Filter rows in this table..." oninput="filterRows()">
          </div>
          <button onclick="toggleRawView()" class="btn btn-slate" id="viewToggleBtn">
            View JSON
          </button>
          <a id="rawApiBtn" href="#" target="_blank" class="btn btn-slate">
            Raw API &nearr;
          </a>
        </div>
      </div>

      <div class="table-container">
        <div class="table-scroll" id="tableScroll">
          <table id="dataTable">
            <thead id="tableHead"></thead>
            <tbody id="tableBody"></tbody>
          </table>
          <div id="emptyMsg" class="empty-state" style="display:none;">
            No records found in this table or matching your search.
          </div>
        </div>
        <div id="rawView" class="raw-view"></div>
      </div>
    </div>
  </div>

  <!-- Detail Modal -->
  <div id="detailModal" onclick="closeModal(event)">
    <div class="modal-box" onclick="event.stopPropagation()">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="font-size:16px; font-weight:900;" id="modalTitle">Record Details</h3>
        <button onclick="document.getElementById('detailModal').style.display='none'" class="btn btn-slate" style="padding:4px 10px;">✕</button>
      </div>
      <div class="modal-pre" id="modalContent"></div>
    </div>
  </div>

  <script>
    let currentTableData = null;
    let isRawMode = false;
    const initialTable = '${summary[0]?.name || "planned_destinations"}';

    async function loadTable(name) {
      document.querySelectorAll('.table-item').forEach(el => el.classList.remove('active'));
      const activeTab = document.getElementById('tab-' + name);
      if (activeTab) activeTab.classList.add('active');

      document.getElementById('currentTableName').innerText = name;
      document.getElementById('rowCountPill').innerText = 'Loading...';
      document.getElementById('rawApiBtn').href = '/api/data/table/' + name;
      document.getElementById('searchInput').value = '';

      try {
        const res = await fetch('/api/data/table/' + name);
        const data = await res.json();
        currentTableData = data;
        renderTable(data);
      } catch (e) {
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="10" style="color:#f87171; text-align:center;">Failed to load table data: ' + e.message + '</td></tr>';
      }
    }

    function renderTable(data) {
      const thead = document.getElementById('tableHead');
      const tbody = document.getElementById('tableBody');
      const emptyMsg = document.getElementById('emptyMsg');

      document.getElementById('rowCountPill').innerText = data.count + ' rows';
      document.getElementById('rawView').innerText = JSON.stringify(data.rows, null, 2);

      if (!data.rows || data.rows.length === 0) {
        thead.innerHTML = '';
        tbody.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
      }
      emptyMsg.style.display = 'none';

      const cols = data.columns.map(c => c.name);
      thead.innerHTML = '<tr><th>#</th>' + cols.map(c => '<th>' + c + '</th>').join('') + '<th>Actions</th></tr>';

      tbody.innerHTML = data.rows.map((row, i) => {
        const cells = cols.map(c => {
          const val = row[c];
          if (val === null || val === undefined) return '<span style="color:#475569;">NULL</span>';
          if (typeof val === 'number') return '<span class="cell-number">' + val + '</span>';
          if (typeof val === 'object') return '<span class="cell-badge">Object</span>';
          const str = String(val);
          return '<span title="' + str.replace(/"/g, '&quot;') + '">' + str + '</span>';
        }).join('');

        return '<tr><td class="cell-id">' + (i + 1) + '</td>' + cells + '<td><button onclick="showDetail(' + i + ')" class="btn btn-slate" style="padding:3px 8px; font-size:10px;">Inspect</button></td></tr>';
      }).join('');
    }

    function filterRows() {
      if (!currentTableData || !currentTableData.rows) return;
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      const rows = document.querySelectorAll('#tableBody tr');
      let visible = 0;

      rows.forEach((tr, i) => {
        const rowData = currentTableData.rows[i];
        const match = !q || JSON.stringify(rowData).toLowerCase().includes(q);
        tr.style.display = match ? '' : 'none';
        if (match) visible++;
      });

      document.getElementById('rowCountPill').innerText = visible + ' / ' + currentTableData.count + ' rows';
      document.getElementById('emptyMsg').style.display = (visible === 0) ? 'block' : 'none';
    }

    function toggleRawView() {
      isRawMode = !isRawMode;
      document.getElementById('tableScroll').style.display = isRawMode ? 'none' : 'block';
      document.getElementById('rawView').style.display = isRawMode ? 'block' : 'none';
      document.getElementById('viewToggleBtn').innerText = isRawMode ? 'View Table' : 'View JSON';
    }

    function showDetail(idx) {
      if (!currentTableData || !currentTableData.rows[idx]) return;
      const row = currentTableData.rows[idx];
      document.getElementById('modalTitle').innerText = (currentTableData.table || 'Record') + ' #' + (idx + 1);
      document.getElementById('modalContent').innerText = JSON.stringify(row, null, 2);
      document.getElementById('detailModal').style.display = 'flex';
    }

    function closeModal(e) {
      document.getElementById('detailModal').style.display = 'none';
    }

    // Auto-load initial table
    loadTable(initialTable);
  </script>
</body>
</html>`;

    res.send(html);
  } catch (err) {
    res.status(500).send('Error loading data explorer: ' + err.message);
  }
});

module.exports = router;
