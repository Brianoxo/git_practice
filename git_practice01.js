tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        dungeon: {
                            950: '#bd297fff',
                            900: '#23b8a4ff',
                            800: '#1a8b3cff',
                        }
                    },
                    fontFamily: {
                        pixel: ['"Courier New", Courier, monospace']
                    }
                }
            }
        }

document.addEventListener('DOMContentLoaded', () => {
// ==========================================
        // 1. 全域變數設定區
        // ==========================================
        const API_URL = "https://script.google.com/macros/s/AKfycbzbfjIgNb_MqxSqYAdNY9XMBRHqVZORt38iQe-ejTiC9XA0QnU22GllRc6DSxe6GA8a/exec"; 

        let currentDungeonData = [];

        // ==========================================
        // 2. 資料讀取 (GET 請求)
        // ==========================================
        async function fetchDungeonData() {
            const loadingOverlay = document.getElementById('loadingOverlay');
            const tableBody = document.getElementById('dungeonTableBody');
            const recordCount = document.getElementById('recordCount');

            loadingOverlay.classList.remove('hidden');

            try {
                if (!API_URL || API_URL.includes("YOUR_APPS_SCRIPT_URL_HERE")) {
                    console.warn("⚠️ API_URL 尚未設定，正在載入模擬 Shareboard 範例資料...");
                    await new Promise(resolve => setTimeout(resolve, 800));
                    currentDungeonData = [
                        { id: 1, character_name: "阿瑟王", player_ID: "Knight#7777", role: "狂戰士", build: "暴擊反擊流", link: "https://example.com/build1" },
                        { id: 2, character_name: "梅林", player_ID: "Wizard#1001", role: "元素法師", build: "極致詠唱速", link: "https://example.com/build2" },
                        { id: 3, character_name: "貞德", player_ID: "Holy#3333", role: "神聖牧師", build: "全能防護罩", link: "https://example.com/build3" }
                    ];
                } else {
                    const response = await fetch(`${API_URL}?action=read`, {
                        method: 'GET',
                        redirect: 'follow'
                    });
                    if (!response.ok) throw new Error(`連線失敗: ${response.statusText}`);
                    const result = await response.json();
                    if (result.status === "error") {
                        throw new Error(result.message || "讀取資料失敗");
                    }
                    currentDungeonData = Array.isArray(result) ? result : (result.data || []);
                }

                renderTable(currentDungeonData);
                recordCount.textContent = `當前總筆數：${currentDungeonData.length}`;

            } catch (error) {
                console.error("Shareboard 通訊異常:", error);
                showRpgModal("⚠️ 傳送門故障", "無法與 Shareboard 建立心靈感應：<br>" + error.message);
                tableBody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-red-400">通訊中斷，請確認 API_URL 是否正確。</td></tr>`;
            } finally {
                loadingOverlay.classList.add('hidden');
                resetSelectionState();
            }
        }

        // 渲染表格與對應 Shareboard 欄位 (id, character_name, player_ID, role, build, link)
        function renderTable(dataList) {
            const tableBody = document.getElementById('dungeonTableBody');
            tableBody.innerHTML = '';

            if (dataList.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-amber-600">目前 Shareboard 內空無一物...</td></tr>`;
                return;
            }

            dataList.forEach((item) => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-amber-950/30 transition-colors";

                // 根據 role 類別給予對應色彩發光的 Badge 標籤
                let badgeClass = "bg-zinc-800 text-zinc-300 border-zinc-600";
                let glowStyle = "";
                const roleVal = item.role || '';
                if (roleVal.includes("狂戰士")) {
                    badgeClass = "bg-red-950 text-red-400 border-red-700";
                    glowStyle = "box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);";
                } else if (roleVal.includes("元素法師") || roleVal.includes("法師")) {
                    badgeClass = "bg-purple-950 text-purple-300 border-purple-700";
                    glowStyle = "box-shadow: 0 0 6px rgba(168, 85, 247, 0.4);";
                } else if (roleVal.includes("神聖牧師") || roleVal.includes("牧師")) {
                    badgeClass = "bg-amber-950 text-amber-300 border-amber-600";
                    glowStyle = "box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);";
                } else if (roleVal.includes("怪物")) {
                    badgeClass = "bg-emerald-950 text-emerald-400 border-emerald-700";
                    glowStyle = "box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);";
                }

                // 處理 link 顯示格式
                let linkHtml = '-';
                if (item.link) {
                    linkHtml = `<a href="${escapeHtml(item.link)}" target="_blank" class="text-amber-400 underline hover:text-amber-200 truncate max-w-[120px] inline-block align-bottom">${escapeHtml(item.link)}</a>`;
                }

                tr.innerHTML = `
                    <td class="p-3 text-center">
                        <input type="checkbox" class="row-checkbox cursor-pointer accent-amber-600 w-4 h-4" value="${item.id || item.character_name}">
                    </td>
                    <td class="p-3 text-amber-600 font-mono text-xs">${item.id || 'N/A'}</td>
                    <td class="p-3 text-amber-100 font-bold">${escapeHtml(item.character_name)}</td>
                    <td class="p-3 text-amber-300/90 font-mono text-[11px]">${escapeHtml(item.player_ID)}</td>
                    <td class="p-3">
                        <span class="px-2 py-0.5 text-[10px] border pixel-border-sm inline-block ${badgeClass}" style="${glowStyle}">
                            ${escapeHtml(item.role)}
                        </span>
                    </td>
                    <td class="p-3 text-amber-200">${escapeHtml(item.build || '-')}</td>
                    <td class="p-3">${linkHtml}</td>
                `;
                tableBody.appendChild(tr);
            });

            bindCheckboxEvents();
        }

        // ==========================================
        // 3. 資料寫入 (POST 請求)
        // ==========================================
        document.getElementById('dungeonForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            const payload = {
                action: "create",
                character_name: document.getElementById('character_name').value.trim(),
                player_ID: document.getElementById('player_ID').value.trim(),
                role: document.getElementById('role').value,
                build: document.getElementById('build').value.trim(),
                link: document.getElementById('link').value.trim()
            };

            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span>✨ 詠唱契約中...</span>`;
            submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

            try {
                if (API_URL && !API_URL.includes("YOUR_APPS_SCRIPT_URL_HERE")) {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(payload),
                        redirect: 'follow'
                    });
                    if (!response.ok) throw new Error(`連線失敗: ${response.statusText}`);
                    const result = await response.json();
                    if (result.status !== "success") {
                        throw new Error(result.message || "後端寫入失敗");
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 600));
                    const maxId = currentDungeonData.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
                    currentDungeonData.unshift({ ...payload, id: maxId + 1 });
                }

                showRpgModal("📜 Shareboard 登錄成功", `角色 <span class="text-amber-400 font-bold">${payload.character_name}</span> 已經成功寫入資料表！`);

                document.getElementById('dungeonForm').reset();
                fetchDungeonData();

            } catch (error) {
                console.error("寫入錯誤:", error);
                showRpgModal("⚠️ 詠唱被打斷", "無法將資料寫入 Shareboard：<br>" + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>⚡ 詠唱並寫入契約</span>`;
                submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
            }
        });

        // ==========================================
        // 4. 資料多選刪除功能 (Batch Delete)
        // ==========================================
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const batchDeleteBtn = document.getElementById('batchDeleteBtn');

        selectAllCheckbox.addEventListener('change', function() {
            const rowCheckboxes = document.querySelectorAll('.row-checkbox');
            rowCheckboxes.forEach(cb => cb.checked = this.checked);
            updateBatchDeleteButtonState();
        });

        function bindCheckboxEvents() {
            const rowCheckboxes = document.querySelectorAll('.row-checkbox');
            rowCheckboxes.forEach(cb => {
                cb.addEventListener('change', function() {
                    updateBatchDeleteButtonState();
                    const allChecked = Array.from(rowCheckboxes).every(item => item.checked);
                    const anyChecked = Array.from(rowCheckboxes).some(item => item.checked);
                    selectAllCheckbox.checked = allChecked;
                    selectAllCheckbox.indeterminate = anyChecked && !allChecked;
                });
            });
        }

        function updateBatchDeleteButtonState() {
            const selectedCount = document.querySelectorAll('.row-checkbox:checked').length;
            if (selectedCount > 0) {
                batchDeleteBtn.disabled = false;
                batchDeleteBtn.textContent = `🔥 驅逐勾選目標 (${selectedCount})`;
                batchDeleteBtn.className = "px-4 py-2 bg-red-700 text-white text-xs font-bold pixel-border-sm pixel-btn-danger cursor-pointer";
            } else {
                batchDeleteBtn.disabled = true;
                batchDeleteBtn.textContent = `🔥 驅逐勾選目標 (0)`;
                batchDeleteBtn.className = "px-4 py-2 bg-zinc-800 text-zinc-500 text-xs font-bold pixel-border-sm pixel-btn-danger cursor-not-allowed";
            }
        }

        batchDeleteBtn.addEventListener('click', function() {
            const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
            const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

            if (selectedIds.length === 0) return;

            showRpgModal(
                "💀 禁忌審判確認",
                `是否確定要將選取的 <span class="text-red-400 font-bold">${selectedIds.length} 筆</span> 目標從 Shareboard 中流放？此動作無法復原！`,
                true,
                async () => {
                    await executeBatchDelete(selectedIds);
                }
            );
        });

        async function executeBatchDelete(ids) {
            const loadingOverlay = document.getElementById('loadingOverlay');
            loadingOverlay.classList.remove('hidden');

            try {
                const payload = {
                    action: "delete",
                    ids: ids
                };

                if (API_URL && !API_URL.includes("YOUR_APPS_SCRIPT_URL_HERE")) {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(payload),
                        redirect: 'follow'
                    });
                    if (!response.ok) throw new Error(`連線失敗: ${response.statusText}`);
                    const result = await response.json();
                    if (result.status !== "success") {
                        throw new Error(result.message || "後端刪除失敗");
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 600));
                    currentDungeonData = currentDungeonData.filter(item => !ids.includes(item.id) && !ids.includes(item.character_name));
                }

                showRpgModal("📜 深淵判決完成", `成功將 <span class="text-red-400 font-bold">${ids.length}</span> 個目標從 Shareboard 移除。`);
                fetchDungeonData();

            } catch (error) {
                console.error("刪除錯誤:", error);
                showRpgModal("⚠️ 黑暗魔力反噬", "執行流放儀式時發生錯誤：<br>" + error.message);
                loadingOverlay.classList.add('hidden');
            }
        }

        function resetSelectionState() {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
            updateBatchDeleteButtonState();
        }

        // ==========================================
        // 5. 輔助工具函式
        // ==========================================
        function showRpgModal(title, htmlMessage, showCancel = false, onConfirm = null) {
            const modal = document.getElementById('rpgModal');
            document.getElementById('modalTitle').innerHTML = title;
            document.getElementById('modalMessage').innerHTML = htmlMessage;

            const modalButtons = document.getElementById('modalButtons');
            if (showCancel) {
                modalButtons.innerHTML = `
                    <button id="modalCancelBtn" class="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs pixel-border-sm">取消</button>
                    <button id="modalConfirmBtn" class="px-5 py-2 bg-red-700 hover:bg-red-600 text-white font-bold text-xs pixel-border-sm pixel-btn-danger">確認流放</button>
                `;
                document.getElementById('modalCancelBtn').onclick = () => modal.classList.add('hidden');
                document.getElementById('modalConfirmBtn').onclick = () => {
                    modal.classList.add('hidden');
                    if (typeof onConfirm === 'function') onConfirm();
                };
            } else {
                modalButtons.innerHTML = `
                    <button id="modalConfirmBtn" class="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold text-xs pixel-border-sm pixel-btn-gold">確定</button>
                `;
                document.getElementById('modalConfirmBtn').onclick = () => modal.classList.add('hidden');
            }

            modal.classList.remove('hidden');
        }

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        document.getElementById('refreshBtn').addEventListener('click', fetchDungeonData);
        fetchDungeonData();
});
