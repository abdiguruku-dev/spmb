// WAJIB ISI URL APPS SCRIPT ANDA DI SINI
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxeLmwjgrv39zeSr5pYhuXGKpngkhfLmlFanwhuq9fe-mxd6rKErI2491D3cF5yAvMv/exec";

let masterData = []; 
let visitData = []; 
let stockData = [];
let editModeId = null; 
let logistikId = null; 
let selectedVisitId = null; 
let currentUserTeam = ""; 
let currentUserRole = "";

const listAtributLogistik = [
    "Topi", "Dasi", "Ikat Pinggang", "Bet Identitas", 
    "Bet Nama OSIS", "Bet Nama Identitas", "Bet Nama Pramuka", "Bet Nama Sekolah", 
    "Kerudung OSIS", "Kerudung Olahraga", "Kerudung Identitas", "Kerudung Pramuka"
];

const baseItemsLogistik = [
    "Atasan OSIS", "Bawahan OSIS", "Atasan Olahraga", "Bawahan Olahraga", ...listAtributLogistik
];

const sidebar = document.getElementById('sidebar'); 
const sidebarOverlay = document.getElementById('sidebarOverlay');

document.getElementById('btnOpenSidebar').addEventListener('click', () => { 
    sidebar.classList.remove('-translate-x-full'); 
    sidebarOverlay.classList.remove('hidden'); 
});

const closeMenu = () => { 
    sidebar.classList.add('-translate-x-full'); 
    sidebarOverlay.classList.add('hidden'); 
};

document.getElementById('btnCloseSidebar').addEventListener('click', closeMenu); 
sidebarOverlay.addEventListener('click', closeMenu);

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer'); 
    const toast = document.createElement('div');
    const isError = type === 'error';
    
    toast.className = `toast-animate flex items-center p-4 mb-3 w-full max-w-sm rounded-xl shadow-lg border-l-4 ${isError ? 'bg-red-50 border-red-500 text-red-800' : 'bg-green-50 border-green-500 text-green-800'}`;
    toast.innerHTML = `<i class="ph-fill ${isError ? 'ph-warning-circle text-red-500' : 'ph-check-circle text-green-500'} text-2xl mr-3"></i><p class="text-sm font-semibold">${message}</p>`;
    
    container.appendChild(toast); 
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 400); 
    }, 3000);
}

const IDLE_TIMEOUT = 15 * 60 * 1000; 

function resetIdleTimer() { 
    if(!document.getElementById('loginView').classList.contains('spa-hidden')) return; 
    sessionStorage.setItem('lastActiveTime', Date.now()); 
}

function checkIdleTime() {
    if(document.getElementById('loginView').classList.contains('spa-hidden')) {
        const lastActive = sessionStorage.getItem('lastActiveTime');
        if (lastActive && (Date.now() - parseInt(lastActive) >= IDLE_TIMEOUT)) {
            document.getElementById('btnLogout').click();
            showToast('Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit.', 'error');
        }
    }
}

setInterval(checkIdleTime, 60000); 
document.addEventListener('visibilitychange', () => { 
    if (document.visibilityState === 'visible') checkIdleTime(); 
});
['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(evt => document.addEventListener(evt, resetIdleTimer));

if(document.getElementById('togglePassword')) {
    document.getElementById('togglePassword').addEventListener('click', function() {
        const pwd = document.getElementById('password'); 
        const icon = document.getElementById('eyeIcon');
        
        if(pwd.type === 'password') { 
            pwd.type = 'text'; 
            icon.classList.replace('ph-eye', 'ph-eye-slash'); 
        } else { 
            pwd.type = 'password'; 
            icon.classList.replace('ph-eye-slash', 'ph-eye'); 
        }
    });
}

function switchView(viewName) {
    const views = ['viewDashboard', 'viewTabel', 'viewForm', 'viewKelolaVisit', 'viewStokLogistik', 'viewLogistik', 'viewVisitGuru', 'viewHasilVisit', 'viewRiwayatVisit', 'viewSettings'];
    views.forEach(v => { 
        if(document.getElementById(v)) document.getElementById(v).classList.add('spa-hidden'); 
    });
    
    const navs = ['navDashboard', 'navTabel', 'navKelolaVisit', 'navStokLogistik', 'navLogistik', 'navVisitGuru', 'navHasilVisit', 'navRiwayatVisit', 'navSettings'];
    navs.forEach(n => { 
        if(document.getElementById(n)) document.getElementById(n).classList.remove('bg-blue-50','text-blue-700'); 
    });
    
    if(document.getElementById('view' + viewName.charAt(0).toUpperCase() + viewName.slice(1))) {
        document.getElementById('view' + viewName.charAt(0).toUpperCase() + viewName.slice(1)).classList.remove('spa-hidden');
    }
    if(document.getElementById('nav' + viewName.charAt(0).toUpperCase() + viewName.slice(1))) {
        document.getElementById('nav' + viewName.charAt(0).toUpperCase() + viewName.slice(1)).classList.add('bg-blue-50','text-blue-700');
    }
    
    if(window.innerWidth < 768) closeMenu();
}

function initSelect2Global() {
    if (typeof $ !== 'undefined') {
        const selects = ['#asal_sekolah', '#desa_kelurahan', '#kecamatan', '#pekerjaan_ayah', '#pekerjaan_ibu', '#v_sd', '#v_desa', '#v_kecamatan', '#diserahkan_kepada', '#hasil_visit', '#pil_1', '#pil_2', '#pil_3'];
        
        selects.forEach(sel => {
            if ($(sel).length) {
                let parentModal = $(sel).closest('.fixed');
                let isTags = ['pekerjaan_ayah', 'pekerjaan_ibu', 'kecamatan', 'v_kecamatan'].includes(sel.replace('#',''));
                
                $(sel).select2({
                    width: '100%',
                    dropdownParent: parentModal.length ? parentModal : $(document.body),
                    tags: isTags
                });
            }
        });
    }
}

// Helper untuk mengisi Select2 (terutama Tags) dengan aman
function setSelect2Value(id, value) {
    if (!value || value === "-" || value === "") {
        $('#' + id).val('').trigger('change');
        return;
    }
    if ($('#' + id).find("option[value='" + value + "']").length) {
        $('#' + id).val(value).trigger('change');
    } else { 
        var newOption = new Option(value, value, true, true);
        $('#' + id).append(newOption).trigger('change');
    } 
}

function bukaFormBaru() {
    editModeId = null; 
    document.getElementById('muridForm').reset(); 
    document.querySelectorAll('input[name="chk_entitas"]').forEach(c => c.checked = false); 
    toggleWali('Bersama Orang Tua'); 
    document.getElementById('formTitle').innerHTML = `<i class="ph-fill ph-file-plus text-blue-600"></i> Input Pendaftaran Murid Baru`; 
    document.getElementById('btnSubmitMurid').innerHTML = `<i class="ph ph-floppy-disk text-xl"></i> Simpan Data Pendaftar`; 
    switchView('form');
    
    if (typeof $ !== 'undefined') $('select').trigger('change');
}

function toggleWali(status) {
    const formWali = document.getElementById('formWali');
    if (status === "Bersama Wali/Kerabat") { 
        formWali.classList.remove('hidden'); 
    } else { 
        formWali.classList.add('hidden'); 
        document.getElementById('nama_wali').value = ''; 
        document.getElementById('hp_wali').value = ''; 
        document.getElementById('alamat_wali').value = ''; 
    }
}

function applySettings(settings) {
    if(settings.app_name) { 
        document.getElementById('loginAppName').innerText = settings.app_name; 
        document.getElementById('sidebarAppName').innerText = settings.app_name; 
        document.getElementById('appDocumentTitle').innerText = settings.app_name; 
    }
    if(settings.logo_url) {
        const lgLogin = document.getElementById('loginLogoImage');
        const lgSidebar = document.getElementById('sidebarLogoImage');
        lgLogin.src = settings.logo_url; 
        lgLogin.classList.remove('hidden'); 
        document.getElementById('loginLogoIcon').classList.add('hidden');
        
        lgSidebar.src = settings.logo_url; 
        lgSidebar.classList.remove('hidden'); 
        document.getElementById('sidebarLogoIcon').classList.add('hidden');
    }
    if(settings.favicon_url) { 
        document.getElementById('appFavicon').href = settings.favicon_url; 
    }
    
    if(document.getElementById('set_app_name')) document.getElementById('set_app_name').value = settings.app_name || "";
    if(document.getElementById('set_app_desc')) document.getElementById('set_app_desc').value = settings.app_desc || "";
    if(document.getElementById('set_logo_url')) document.getElementById('set_logo_url').value = settings.logo_url || "";
    if(document.getElementById('set_favicon_url')) document.getElementById('set_favicon_url').value = settings.favicon_url || "";
    if(document.getElementById('set_sekolah_nama')) document.getElementById('set_sekolah_nama').value = settings.sekolah_nama || "";
    if(document.getElementById('set_sekolah_akreditasi')) document.getElementById('set_sekolah_akreditasi').value = settings.sekolah_akreditasi || "";
    if(document.getElementById('set_sekolah_alamat')) document.getElementById('set_sekolah_alamat').value = settings.sekolah_alamat || "";
    if(document.getElementById('set_sekolah_email')) document.getElementById('set_sekolah_email').value = settings.sekolah_email || "";
    if(document.getElementById('set_sekolah_website')) document.getElementById('set_sekolah_website').value = settings.sekolah_website || "";
}

document.addEventListener('DOMContentLoaded', async () => { 
    initSelect2Global();

    try { 
        const s = await fetch(SCRIPT_URL.trim() + "?action=get_settings"); 
        const textRes = await s.text();
        const sRes = JSON.parse(textRes); 
        if(sRes.status === 'success') applySettings(sRes.data); 
    } catch(e){}
    
    const saved = sessionStorage.getItem('spmb_session'); 
    if(saved) { 
        tampilkanApp(JSON.parse(saved)); 
        startAutoSync(); 
    }
    
    const chkContainer = document.getElementById('checklistAtributContainer');
    if(chkContainer) { 
        listAtributLogistik.forEach(attr => { 
            chkContainer.innerHTML += `<label class="flex items-center space-x-2 text-sm bg-slate-50 p-2 rounded border cursor-pointer hover:bg-slate-100"><input type="checkbox" name="chk_logistik_attr" value="${attr}" class="rounded text-blue-600 focus:ring-blue-500"><span>${attr}</span></label>`; 
        }); 
    }
});

function downloadFormatExcel() {
    const ws_data = [
        ["Tim_Alokasi", "Nama_Lengkap", "L_P", "Asal_Sekolah", "Nama_Ayah", "Nama_Ibu", "Alamat", "Tanggal_Mulai", "Batas_Waktu", "Desa_Kelurahan", "Kecamatan"],
        ["Tim 1", "Budi Santoso", "Laki-laki", "SD Negeri 1 Kebumen", "Joko", "Siti", "Dusun Krajan RT 01 RW 02", "2024-05-01", "2024-05-15", "Aditirto", "Pejagoan"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wscols = [ {wch: 15}, {wch: 25}, {wch: 10}, {wch: 25}, {wch: 20}, {wch: 20}, {wch: 35}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 20} ];
    ws['!cols'] = wscols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_Target_Visit");
    XLSX.writeFile(wb, "Format_Import_Visit.xlsx");
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    const btnText = document.getElementById('btnText'); 
    btnText.innerText = "Memproses...";
    
    try {
        const fd = new URLSearchParams(); 
        fd.append('action', 'login'); 
        fd.append('username', document.getElementById('username').value.trim()); 
        fd.append('password', document.getElementById('password').value.trim());
        
        const response = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: fd }); 
        const textRes = await response.text(); 
        let result;
        
        try {
            result = JSON.parse(textRes);
        } catch(e) {
            throw new Error("Akses diblokir oleh sistem (Google Workspace) atau URL salah.");
        }
        
        if (result.status === 'success') { 
            sessionStorage.setItem('spmb_session', JSON.stringify(result.data)); 
            sessionStorage.setItem('lastActiveTime', Date.now()); 
            tampilkanApp(result.data); 
            startAutoSync(); 
        } else { 
            showToast(result.message, 'error'); 
        } 
    } catch (err) { 
        showToast('Koneksi Gagal: ' + err.message, 'error'); 
    } finally { 
        btnText.innerText = "Masuk ke Sistem"; 
    }
});

document.getElementById('btnLogout').addEventListener('click', () => { 
    sessionStorage.removeItem('spmb_session'); 
    sessionStorage.removeItem('lastActiveTime'); 
    if(window.syncInterval) clearInterval(window.syncInterval); 
    location.reload(); 
});

async function tampilkanApp(userData) {
    document.getElementById('loginView').classList.add('spa-hidden'); 
    document.getElementById('appView').classList.remove('spa-hidden');
    document.getElementById('userNameDisplay').innerText = userData.nama_lengkap; 
    document.getElementById('userRoleBadge').innerText = userData.role;
    
    currentUserTeam = userData.tim_visitor || ""; 
    currentUserRole = userData.role;
    
    let roleStr = currentUserRole.trim().toLowerCase(); 
    
    const allNavs = ['navDashboard','navTabel','navKelolaVisit','navStokLogistik','navLogistik','navVisitGuru','navHasilVisit','navRiwayatVisit','navSettings'];
    const allLabels = ['labelMenuUtama', 'labelMenuLogistik', 'labelMenuVisit', 'labelMenuAdmin'];
    
    allNavs.forEach(n => { if(document.getElementById(n)) document.getElementById(n).classList.add('hidden'); });
    allLabels.forEach(l => { if(document.getElementById(l)) document.getElementById(l).classList.add('hidden'); });

    if(document.getElementById('navDashboard')) document.getElementById('navDashboard').classList.remove('hidden');
    if(document.getElementById('labelMenuUtama')) document.getElementById('labelMenuUtama').classList.remove('hidden');

    ['panelPendaftar', 'panelSDDesa', 'berkasPanel', 'logistikPanel', 'visitStatsPanel', 'adminUsersStatsPanel'].forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).classList.add('hidden');
    });
    
    ['panelPendaftar', 'panelSDDesa'].forEach(id => { 
        if(document.getElementById(id)) document.getElementById(id).classList.remove('hidden'); 
    });

    if (roleStr === "administrator") {
        ['navTabel', 'navKelolaVisit', 'navStokLogistik', 'navLogistik', 'navSettings'].forEach(n => document.getElementById(n).classList.remove('hidden'));
        allLabels.forEach(l => document.getElementById(l).classList.remove('hidden'));
        document.getElementById('btnTambahPendaftarUtama').classList.remove('hidden'); 
        
        ['adminUsersStatsPanel', 'berkasPanel', 'logistikPanel', 'visitStatsPanel'].forEach(id => { 
            if(document.getElementById(id)) document.getElementById(id).classList.remove('hidden'); 
        });
        loadUsersData(); 
    } 
    else if (roleStr === "kepala sekolah" || roleStr === "ketua panitia") {
        ['navTabel', 'navStokLogistik', 'navLogistik'].forEach(n => document.getElementById(n).classList.remove('hidden'));
        document.getElementById('labelMenuLogistik').classList.remove('hidden');
        
        ['berkasPanel', 'logistikPanel'].forEach(id => { 
            if(document.getElementById(id)) document.getElementById(id).classList.remove('hidden'); 
        });
        document.getElementById('btnTambahPendaftarUtama').classList.add('hidden'); 
    } 
    else if (roleStr === "admin input") {
        document.getElementById('navTabel').classList.remove('hidden'); 
        document.getElementById('navKelolaVisit').classList.remove('hidden'); 
        document.getElementById('btnTambahPendaftarUtama').classList.remove('hidden'); 
        document.getElementById('berkasPanel').classList.remove('hidden');
    } 
    else if (roleStr === "petugas seragam" || roleStr === "logistik") {
        document.getElementById('navTabel').classList.remove('hidden'); 
        document.getElementById('navStokLogistik').classList.remove('hidden'); 
        document.getElementById('navLogistik').classList.remove('hidden'); 
        document.getElementById('labelMenuLogistik').classList.remove('hidden'); 
        document.getElementById('logistikPanel').classList.remove('hidden'); 
        document.getElementById('btnTambahPendaftarUtama').classList.add('hidden');
    } 
    else if (roleStr === "guru") {
        document.getElementById('navTabel').classList.remove('hidden'); 
        document.getElementById('btnTambahPendaftarUtama').classList.add('hidden');
    }

    if (currentUserTeam.trim() !== "" || roleStr === "administrator" || roleStr === "kepala sekolah" || roleStr === "ketua panitia") {
        if(document.getElementById('navVisitGuru')) document.getElementById('navVisitGuru').classList.remove('hidden');
        if(document.getElementById('navHasilVisit')) document.getElementById('navHasilVisit').classList.remove('hidden');
        if(document.getElementById('navRiwayatVisit')) document.getElementById('navRiwayatVisit').classList.remove('hidden');
        if(document.getElementById('labelMenuVisit')) document.getElementById('labelMenuVisit').classList.remove('hidden');
        loadVisitData(false);
    }
    
    switchView('dashboard'); 
    fetchReferences(); 
    await loadStokData();
    await loadMasterData(false);
}

if(document.getElementById('formSettings')) {
    document.getElementById('formSettings').addEventListener('submit', async(e) => {
        e.preventDefault(); 
        const btn = document.getElementById('btnSaveSettings'); 
        btn.disabled = true; 
        btn.innerText="Menyimpan...";
        
        const payload = new URLSearchParams(); 
        payload.append('action', 'save_settings'); 
        payload.append('app_name', document.getElementById('set_app_name').value); 
        payload.append('app_desc', document.getElementById('set_app_desc').value);
        payload.append('logo_url', document.getElementById('set_logo_url').value);
        payload.append('favicon_url', document.getElementById('set_favicon_url').value);
        payload.append('sekolah_nama', document.getElementById('set_sekolah_nama').value);
        payload.append('sekolah_akreditasi', document.getElementById('set_sekolah_akreditasi').value);
        payload.append('sekolah_alamat', document.getElementById('set_sekolah_alamat').value);
        payload.append('sekolah_email', document.getElementById('set_sekolah_email').value);
        payload.append('sekolah_website', document.getElementById('set_sekolah_website').value);
        
        try {
            const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); 
            const r = await res.json();
            if(r.status === 'success') { 
                showToast('Pengaturan tersimpan!'); 
                applySettings({
                    app_name: document.getElementById('set_app_name').value, 
                    app_desc: document.getElementById('set_app_desc').value,
                    logo_url: document.getElementById('set_logo_url').value,
                    favicon_url: document.getElementById('set_favicon_url').value,
                    sekolah_nama: document.getElementById('set_sekolah_nama').value,
                    sekolah_akreditasi: document.getElementById('set_sekolah_akreditasi').value,
                    sekolah_alamat: document.getElementById('set_sekolah_alamat').value,
                    sekolah_email: document.getElementById('set_sekolah_email').value,
                    sekolah_website: document.getElementById('set_sekolah_website').value
                }); 
            }
        } catch(err) { 
            showToast('Gagal terhubung ke Server', 'error'); 
        } finally { 
            btn.disabled = false; 
            btn.innerHTML = `<i class="ph ph-floppy-disk align-middle mr-1"></i> Simpan Profil & Identitas`; 
        }
    });
}

function startAutoSync() {
    if(window.syncInterval) clearInterval(window.syncInterval);
    window.syncInterval = setInterval(async () => { 
        if(sessionStorage.getItem('spmb_session')) { 
            await loadStokData();
            await loadMasterData(true); 
            loadVisitData(true); 
        } 
    }, 10000); 
}

async function fetchReferences() {
    try {
        const response = await fetch(SCRIPT_URL.trim() + "?action=get_references"); 
        const textRes = await response.text();
        const result = JSON.parse(textRes);
        
        if(result.status === "success") {
            const populate = (id, data) => { 
                const el = document.getElementById(id); 
                if(el) { 
                    el.innerHTML = '<option value="">-- Pilih --</option>'; 
                    data.forEach(i => el.innerHTML += `<option value="${i}">${i}</option>`); 
                }
            };
            
            populate('desa_kelurahan', result.data.desa); populate('v_desa', result.data.desa); 
            populate('asal_sekolah', result.data.sekolah); populate('v_sd', result.data.sekolah); 
            populate('v_tim', result.data.tim); 
            populate('kecamatan', result.data.kecamatan); populate('v_kecamatan', result.data.kecamatan);
            populate('pekerjaan_ayah', result.data.pekerjaan); populate('pekerjaan_ibu', result.data.pekerjaan);
            
            const elCheck = document.getElementById('entitas_checkbox_container'); 
            if(elCheck) { 
                elCheck.innerHTML = ''; 
                const combinedEntitas = [...(result.data.entitas || []), ...(result.data.individu || [])];
                combinedEntitas.forEach(item => { 
                    elCheck.innerHTML += `<label class="flex items-center space-x-2 text-sm bg-slate-50 p-2 rounded border cursor-pointer hover:bg-slate-100 transition-colors"><input type="checkbox" name="chk_entitas" value="${item}" class="rounded text-blue-600 focus:ring-blue-500"><span>${item}</span></label>`; 
                }); 
            }
            
            const optGrp = document.getElementById('optgroupIndividu'); 
            if(optGrp) { 
                optGrp.innerHTML = ''; 
                if (result.data.individu) {
                    result.data.individu.forEach(i => { optGrp.innerHTML += `<option value="${i}">${i}</option>`; }); 
                }
            }
            
            if(result.data.kompetitor && result.data.kompetitor.length > 0) {
                ['pil_1', 'pil_2', 'pil_3'].forEach(id => {
                    const el = document.getElementById(id);
                    if(el) { 
                        el.innerHTML = '<option value="">-- Pilih --</option>'; 
                        result.data.kompetitor.forEach(s => el.innerHTML += `<option value="${s}">${s}</option>`); 
                    }
                });
            }
            
            if (typeof $ !== 'undefined') $('select').trigger('change');
        }
    } catch (error) { console.error("Error Fetch Reference", error); }
}

async function loadMasterData(isBackground = false) {
    try {
        const response = await fetch(SCRIPT_URL.trim() + "?action=get_master_data"); 
        const result = await response.json();
        
        if (result.status === "success") { 
            masterData = result.data; 
            
            try { prosesDashboard(masterData); } catch(e){} 
            try { renderDashboardStokCards(); } catch(e){} 
            try { renderStokLogistik(); } catch(e){} 
            
            let qUtama = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim() : "";
            if (qUtama === "") { try { renderTabel(masterData); } catch(e){} }

            let qLog = document.getElementById('searchLogistik') ? document.getElementById('searchLogistik').value.trim() : "";
            if (qLog === "") { try { renderLogistik(masterData); } catch(e){} }
        }
    } catch (error) {}
}

async function loadStokData() {
    try {
        const response = await fetch(SCRIPT_URL.trim() + "?action=get_stok"); 
        const result = await response.json();
        if (result.status === "success") { 
            stockData = result.data;
        }
    } catch (error) {}
}

async function loadVisitData(isBackground = false) {
    let roleFetch = currentUserRole.trim().toLowerCase();
    if(!currentUserTeam && roleFetch !== 'administrator' && roleFetch !== 'kepala sekolah' && roleFetch !== 'ketua panitia') return;
    
    let timFetch = currentUserTeam;
    try {
        const response = await fetch(SCRIPT_URL.trim() + "?action=get_visit_data&tim=" + encodeURIComponent(timFetch) + "&role=" + encodeURIComponent(currentUserRole)); 
        const result = await response.json();
        if (result.status === "success") { 
            visitData = result.data; 
            let qV = document.getElementById('searchVisit') ? document.getElementById('searchVisit').value.trim() : "";
            let qR = document.getElementById('searchRiwayatVisit') ? document.getElementById('searchRiwayatVisit').value.trim() : "";
            let qH = document.getElementById('searchHasilVisit') ? document.getElementById('searchHasilVisit').value.trim() : "";
            
            if (qV === "" && qR === "" && qH === "") {
                try { renderVisitAndRiwayat(visitData); } catch(e){}
            }
        }
    } catch (error) {}
}

if(document.getElementById('formManualVisit')) {
    document.getElementById('formManualVisit').addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const btn = document.getElementById('btnSubmitManualVisit'); 
        btn.disabled = true; btn.innerHTML = "Menyimpan...";
        
        const payload = new URLSearchParams();
        payload.append('action', 'insert_target_visit');
        payload.append('nama_lengkap', document.getElementById('v_nama').value); 
        payload.append('lp', document.getElementById('v_lp').value);
        payload.append('asal_sekolah', document.getElementById('v_sd').value); 
        payload.append('tim_alokasi', document.getElementById('v_tim').value);
        payload.append('nama_ayah', document.getElementById('v_ayah').value); 
        payload.append('nama_ibu', document.getElementById('v_ibu').value);
        payload.append('alamat', document.getElementById('v_alamat').value);
        payload.append('tanggal_mulai', document.getElementById('v_mulai').value); 
        payload.append('batas_waktu', document.getElementById('v_batas').value); 
        payload.append('desa_kelurahan', document.getElementById('v_desa').value); 
        payload.append('kecamatan', document.getElementById('v_kecamatan').value);
        
        try {
            const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); 
            const r = await res.json();
            if(r.status === 'success') { 
                showToast('Target Visit berhasil ditambah!'); 
                document.getElementById('formManualVisit').reset(); 
                if (typeof $ !== 'undefined') $('select').trigger('change');
                loadVisitData(false); 
            } else { showToast(r.message, 'error'); }
        } catch(err) { showToast('Koneksi terputus', 'error'); 
        } finally { btn.disabled = false; btn.innerHTML = `<i class="ph ph-plus-circle align-middle mr-1"></i> Simpan Target`; }
    });
}

if(document.getElementById('btnImportExcel')) {
    document.getElementById('btnImportExcel').addEventListener('click', () => {
        const fileInput = document.getElementById('fileExcelVisit');
        if(!fileInput.files.length) return showToast('Pilih file Excel terlebih dahulu!', 'error');
        
        const btn = document.getElementById('btnImportExcel'); 
        btn.disabled = true; btn.innerText = "Memproses Excel...";
        const file = fileInput.files[0]; 
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result); 
                const workbook = XLSX.read(data, {type: 'array'});
                const sheetName = workbook.SheetNames[0]; 
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, {raw: false});
                
                if(json.length === 0) throw new Error("Excel Kosong");
                
                const payload = new URLSearchParams();
                payload.append('action', 'import_target_visit');
                payload.append('data_json', JSON.stringify(json));

                const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); 
                const r = await res.json();
                
                if(r.status === 'success') { 
                    showToast(r.message); fileInput.value = ""; loadVisitData(false); 
                } else { showToast(r.message, 'error'); }
            } catch(err) { showToast('Gagal memproses file Excel. Pastikan format benar.', 'error'); 
            } finally { btn.disabled = false; btn.innerHTML = `<i class="ph ph-upload-simple"></i> Proses Import`; }
        };
        reader.readAsArrayBuffer(file);
    });
}

window.tempDataGlobal = {}; 

function showDetailTable(title, globalKey) {
    document.getElementById('detailTableTitle').innerHTML = `<i class="ph-fill ph-list-magnifying-glass"></i> ${title}`;
    const tbody = document.getElementById('detailTableBody');
    tbody.innerHTML = '';
    const dataList = window.tempDataGlobal[globalKey] || [];
    
    if(dataList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400">Tidak ada data.</td></tr>';
    } else {
        dataList.forEach(item => {
            tbody.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="p-3 text-slate-600">${item.id}</td><td class="p-3 font-semibold text-slate-800">${item.nama}</td><td class="p-3 text-center">${item.lp}</td><td class="p-3 text-slate-600">${item.desa || '-'}</td><td class="p-3 text-slate-600">${item.sekolah || '-'}</td></tr>`;
        });
    }
    document.getElementById('modalDetailTable').classList.remove('spa-hidden');
}

function prosesDashboard(data) {
    if(!document.getElementById('statTotal')) return;
    document.getElementById('statTotal').innerText = data.length; 
    document.getElementById('statLaki').innerText = data.filter(m => m.jenis_kelamin === "Laki-laki").length; 
    document.getElementById('statPerempuan').innerText = data.filter(m => m.jenis_kelamin === "Perempuan").length;
    
    let rSD = {}; let rDesa = {};
    data.forEach(m => {
        let sd = m.asal_sekolah || "Tidak Diketahui"; let desa = m.desa_kelurahan || "Tidak Diketahui"; let jk = m.jenis_kelamin === "Laki-laki" ? "L" : "P";
        if(!rSD[sd]) rSD[sd] = {L:0, P:0, T:0}; rSD[sd][jk]++; rSD[sd].T++;
        if(!rDesa[desa]) rDesa[desa] = {L:0, P:0, T:0}; rDesa[desa][jk]++; rDesa[desa].T++;
    });
    
    const tbodySD = document.getElementById('bodyRekapSD'); 
    if(tbodySD) { 
        tbodySD.innerHTML = ''; 
        Object.keys(rSD).sort((a,b) => rSD[b].T - rSD[a].T).forEach(k => { 
            tbodySD.innerHTML += `<tr class="clickable-row border-b" onclick="doDrillDownUtama('asal_sekolah', '${k}')"><td class="p-3">${k}</td><td class="p-3 text-center">${rSD[k].L}</td><td class="p-3 text-center">${rSD[k].P}</td><td class="p-3 text-center font-bold text-blue-600">${rSD[k].T}</td></tr>`; 
        });
    }
    const tbodyDesa = document.getElementById('bodyRekapDesa'); 
    if(tbodyDesa) { 
        tbodyDesa.innerHTML = ''; 
        Object.keys(rDesa).sort((a,b) => rDesa[b].T - rDesa[a].T).forEach(k => { 
            tbodyDesa.innerHTML += `<tr class="clickable-row border-b" onclick="doDrillDownUtama('desa_kelurahan', '${k}')"><td class="p-3">${k}</td><td class="p-3 text-center">${rDesa[k].L}</td><td class="p-3 text-center">${rDesa[k].P}</td><td class="p-3 text-center font-bold text-emerald-600">${rDesa[k].T}</td></tr>`; 
        });
    }

    const berkasKunci = [{ key: 'berkas_formulir', label: 'Formulir Pendaftaran' }, { key: 'berkas_skl', label: 'Surat Kelulusan (SKL)' }, { key: 'berkas_nilai', label: 'Daftar Nilai' }, { key: 'berkas_tka', label: 'Hasil TKA' }, { key: 'berkas_foto', label: 'Foto 3x4' }, { key: 'berkas_ijazah', label: 'Ijazah Kelulusan' }, { key: 'berkas_kk', label: 'Kartu Keluarga (KK)' }, { key: 'berkas_akte', label: 'Akte Kelahiran' }, { key: 'berkas_bantuan', label: 'Bukti Bantuan' }];
    const containerBerkas = document.getElementById('berkasStatsContainer'); 
    if(containerBerkas) { 
        containerBerkas.innerHTML = '';
        berkasKunci.forEach(b => {
            let jlmBelum = data.filter(m => m[b.key] === "Belum Ada").length; let jlmAda = data.length - jlmBelum;
            const card = document.createElement('div'); card.className = `p-3 bg-white border rounded-xl shadow-sm border-l-4 ${jlmBelum > 0 ? 'border-l-red-500 hover:bg-red-50 cursor-pointer' : 'border-l-green-500'}`;
            card.innerHTML = `<p class="text-xs text-slate-500 font-semibold truncate mb-2">${b.label}</p><div class="flex justify-between items-center"><div><p class="text-[10px] text-slate-400 uppercase">Terkumpul</p><h4 class="text-lg font-bold text-green-600 leading-none">${jlmAda}</h4></div><div class="text-right"><p class="text-[10px] text-slate-400 uppercase">Kurang</p><h4 class="text-lg font-bold ${jlmBelum > 0 ? 'text-red-600' : 'text-slate-400'} leading-none">${jlmBelum}</h4></div></div>`;
            if (jlmBelum > 0) { card.onclick = () => { switchView('tabel'); document.getElementById('searchInput').value = `missing:${b.key}`; filterTabel(`missing:${b.key}`); }; } 
            containerBerkas.appendChild(card);
        });
    }
}

function renderDashboardStokCards() {
    if (!masterData || masterData.length === 0) return;
    let tallyKeluar = {}; let tallyKebutuhan = {}; let totalMurid = masterData.length; let selesai = 0;
    baseItemsLogistik.forEach(item => { tallyKeluar[item] = 0; tallyKebutuhan[item] = totalMurid; });
    let listBelumDetail = {}; baseItemsLogistik.forEach(item => listBelumDetail[item] = []);

    masterData.forEach(m => {
        let dAttr = m.atribut_lengkap || ""; let arrAttr = dAttr.split(",").map(a => a.trim());
        let attrComplete = (arrAttr.length >= listAtributLogistik.length); 
        let getOsis = (m.status_osis === 'Sudah'); let getOr = (m.status_or === 'Sudah');
        if (getOsis && getOr && attrComplete) { selesai++; }
        if (getOsis) { tallyKeluar['Atasan OSIS']++; tallyKeluar['Bawahan OSIS']++; }
        if (getOr) { tallyKeluar['Atasan Olahraga']++; tallyKeluar['Bawahan Olahraga']++; }
        arrAttr.forEach(a => { if(tallyKeluar[a] !== undefined) tallyKeluar[a]++; });
        let mData = { id: m.id_pendaftaran, nama: m.nama_lengkap, lp: m.jenis_kelamin === 'Laki-laki' ? 'L' : 'P', desa: m.desa_kelurahan, sekolah: m.asal_sekolah };
        if (!getOsis) { listBelumDetail['Atasan OSIS'].push(mData); listBelumDetail['Bawahan OSIS'].push(mData); }
        if (!getOr) { listBelumDetail['Atasan Olahraga'].push(mData); listBelumDetail['Bawahan Olahraga'].push(mData); }
        listAtributLogistik.forEach(a => { if(!arrAttr.includes(a)) { listBelumDetail[a].push(mData); } });
    });

    if(document.getElementById('logStatTotal')) {
        document.getElementById('logStatTotal').innerText = totalMurid; document.getElementById('logStatSelesai').innerText = selesai; document.getElementById('logStatBelum').innerText = totalMurid - selesai;
    }

    const sizeContainer = document.getElementById('sizeStatsContainer'); const attrContainer = document.getElementById('attrStatsContainer');
    if(sizeContainer) sizeContainer.innerHTML = ''; if(attrContainer) attrContainer.innerHTML = '';

    baseItemsLogistik.forEach((item, index) => {
        let sData = stockData.find(s => s.nama_barang === item) || {stok_awal: 0, barang_masuk: 0};
        let awal = parseInt(sData.stok_awal) || 0; let masuk = parseInt(sData.barang_masuk) || 0;
        let keluar = tallyKeluar[item]; let sisaStok = awal + masuk - keluar;
        let kebutuhanSisa = tallyKebutuhan[item] - keluar; if (kebutuhanSisa < 0) kebutuhanSisa = 0;
        let selisih = sisaStok - kebutuhanSisa;
        let badgeClass = "", statusText = "", icon = "";
        
        if (selisih >= 15) { badgeClass = "bg-green-50 border-green-200 text-green-800"; statusText = "Aman"; icon = "ph-check-circle text-green-500";
        } else if (selisih >= 0 && selisih < 15) { badgeClass = "bg-amber-50 border-amber-200 text-amber-800"; statusText = "Segera Restock"; icon = "ph-warning-circle text-amber-500";
        } else { badgeClass = "bg-red-50 border-red-200 text-red-800"; statusText = "Habis / Kurang"; icon = "ph-x-circle text-red-500"; }

        let globalKey = 'dashboard_belum_' + index; window.tempDataGlobal[globalKey] = listBelumDetail[item];
        let btnHtml = kebutuhanSisa > 0 ? `<button onclick="showDetailTable('Belum Dapat: ${item}', '${globalKey}')" class="w-full mt-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-1.5 rounded transition-colors shadow-sm">Lihat Siswa (${kebutuhanSisa})</button>` : `<div class="w-full mt-3 text-center text-xs text-green-600 font-bold py-1.5"><i class="ph-fill ph-check-circle align-middle"></i> Semua Sudah Dapat</div>`;

        let cardHtml = `<div class="p-4 border rounded-xl shadow-sm ${badgeClass} flex flex-col justify-between"><div><div class="flex justify-between items-start mb-2"><h4 class="font-bold text-sm tracking-tight">${item}</h4><i class="ph-fill ${icon} text-xl"></i></div><div class="grid grid-cols-2 gap-2 mt-3"><div class="bg-white/60 p-2 rounded text-center"><p class="text-[10px] uppercase font-bold opacity-70">Tersedia</p><p class="text-lg font-black">${sisaStok}</p></div><div class="bg-white/60 p-2 rounded text-center"><p class="text-[10px] uppercase font-bold opacity-70">Kebutuhan</p><p class="text-lg font-black">${kebutuhanSisa}</p></div></div><div class="mt-2 text-center text-xs font-bold py-1 bg-white/50 rounded">Status: ${statusText}</div></div>${btnHtml}</div>`;
        if (["Atasan OSIS", "Bawahan OSIS", "Atasan Olahraga", "Bawahan Olahraga"].includes(item)) { if(sizeContainer) sizeContainer.innerHTML += cardHtml; } else { if(attrContainer) attrContainer.innerHTML += cardHtml; }
    });
}

function renderStokLogistik() {
    if(!masterData || masterData.length === 0) return;
    let tallyKeluar = {}; let tallyKebutuhan = {}; let totalMurid = masterData.length;
    baseItemsLogistik.forEach(item => { tallyKeluar[item] = 0; tallyKebutuhan[item] = totalMurid; });
    masterData.forEach(m => {
        if(m.status_osis === 'Sudah') { tallyKeluar['Atasan OSIS']++; tallyKeluar['Bawahan OSIS']++; }
        if(m.status_or === 'Sudah') { tallyKeluar['Atasan Olahraga']++; tallyKeluar['Bawahan Olahraga']++; }
        let attrs = m.atribut_lengkap ? m.atribut_lengkap.split(",") : [];
        attrs.forEach(a => { if(tallyKeluar[a.trim()] !== undefined) tallyKeluar[a.trim()]++; });
    });

    const tbody = document.getElementById('tableStokBody'); if(!tbody) return; tbody.innerHTML = '';
    let rCheck = currentUserRole.trim().toLowerCase(); let allowEdit = (rCheck === 'administrator' || rCheck === 'logistik' || rCheck === 'petugas seragam');

    baseItemsLogistik.forEach((item, index) => {
        let sData = stockData.find(s => s.nama_barang === item) || {stok_awal: 0, barang_masuk: 0};
        let awal = parseInt(sData.stok_awal) || 0; let masuk = parseInt(sData.barang_masuk) || 0;
        let keluar = tallyKeluar[item] || 0; let butuh = (tallyKebutuhan[item] || 0) - keluar; if (butuh < 0) butuh = 0;
        let sisa = awal + masuk - keluar; let selisih = sisa - butuh;
        let ket = "Aman", badge = "bg-green-100 text-green-700 border-green-200";
        if (selisih < 0) { ket = "Habis / Kurang"; badge = "bg-red-100 text-red-700 border-red-200"; } else if (selisih >= 0 && selisih < 15) { ket = "Segera Restock"; badge = "bg-amber-100 text-amber-700 border-amber-200"; }

        if(tbody) {
            let btnEdit = allowEdit ? `<button onclick="editStok('${item}', ${awal}, ${masuk})" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded shadow text-xs font-bold transition-colors"><i class="ph ph-pencil-simple"></i> Edit</button>` : `<span class="text-xs text-slate-400 italic">Read-only</span>`;
            let globalKey = 'stok_belum_' + index; 
            let btnLihat = butuh > 0 ? `<button onclick="showDetailTable('Belum Dapat: ${item}', 'dashboard_belum_${index}')" class="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2 py-1 rounded shadow-sm text-xs font-bold transition-colors ml-1 mt-1 xl:mt-0"><i class="ph ph-users"></i> Siapa?</button>` : '';
            tbody.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="p-3 text-center">${index + 1}</td><td class="p-3 font-bold text-slate-800">${item}</td><td class="p-3 text-center text-slate-600">${awal}</td><td class="p-3 text-center text-blue-600 font-bold">+${masuk}</td><td class="p-3 text-center text-amber-600 font-bold">-${keluar}</td><td class="p-3 text-center text-slate-800 font-bold text-lg">${sisa}</td><td class="p-3 text-center text-slate-500">${butuh}</td><td class="p-3 text-center"><span class="px-2 py-1 rounded border text-[10px] uppercase tracking-wider font-bold ${badge}">${ket}</span></td><td class="p-3 text-center whitespace-nowrap">${btnEdit}${btnLihat}</td></tr>`;
        }
    });
}

function editStok(nama, awal, masuk) {
    document.getElementById('stok_nama').value = nama; document.getElementById('stok_awal').value = awal; document.getElementById('stok_masuk').value = masuk; document.getElementById('modalEditStok').classList.remove('spa-hidden');
}

if(document.getElementById('formEditStokLogic')) {
    document.getElementById('formEditStokLogic').addEventListener('submit', async(e) => {
        e.preventDefault(); const btn = document.getElementById('btnUpdateStok'); btn.disabled = true; btn.innerText="Menyimpan...";
        const payload = new URLSearchParams(); payload.append('action', 'save_stok'); payload.append('nama_barang', document.getElementById('stok_nama').value); payload.append('stok_awal', document.getElementById('stok_awal').value); payload.append('barang_masuk', document.getElementById('stok_masuk').value); 
        try {
            const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); const r = await res.json();
            if(r.status === 'success') { showToast('Stok berhasil diupdate!'); document.getElementById('modalEditStok').classList.add('spa-hidden'); loadStokData(); } else showToast(r.message, 'error');
        } catch(e) { showToast('Error koneksi', 'error'); } finally { btn.disabled = false; btn.innerText="Simpan Stok"; }
    });
}

function doDrillDownUtama(field, value) { 
    let rCheck = currentUserRole.trim().toLowerCase();
    if(rCheck !== "administrator" && rCheck !== "kepala sekolah" && rCheck !== "ketua panitia" && rCheck !== "admin input") return;
    switchView('tabel'); document.getElementById('searchInput').value = `filter:${field}=${value}`; filterTabel(`filter:${field}=${value}`); 
}

function viewData(id) {
    const d = masterData.find(m => m.id_pendaftaran === id); if(!d) return; 
    const content = document.getElementById('viewModalContent');
    const renderField = (label, val) => `<div><p class="text-slate-500 text-[10px] uppercase font-bold tracking-wider">${label}</p><p class="font-medium text-slate-800 text-sm">${val || '-'}</p></div>`;
    content.innerHTML = `<div class="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"><div><p class="text-sm text-blue-600 font-semibold">ID Pendaftaran</p><p class="text-2xl font-bold text-blue-900">${d.id_pendaftaran}</p></div><div class="text-left md:text-right"><p class="text-sm text-slate-500">Asal Sekolah</p><p class="font-semibold text-slate-800">${d.asal_sekolah || '-'}</p></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-8"><div class="space-y-6"><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-user"></i> Biodata Murid</h4><div class="grid grid-cols-2 gap-3"><div class="col-span-2">${renderField('Nama Lengkap', d.nama_lengkap)}</div>${renderField('Jenis Kelamin', d.jenis_kelamin)} ${renderField('Agama', d.agama)} ${renderField('Tempat Lahir', d.tempat_lahir)} ${renderField('Tanggal Lahir', d.tanggal_lahir ? new Date(d.tanggal_lahir).toLocaleDateString('id-ID') : '-')} ${renderField('NIK', d.nik)} ${renderField('NISN', d.nisn)} ${renderField('No HP Murid', d.no_hp_murid)}</div></div><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-house"></i> Domisili &amp; Wali</h4><div class="space-y-3">${renderField('Alamat Lengkap', d.alamat_lengkap)}<div class="grid grid-cols-2 gap-3">${renderField('Desa/Kelurahan', d.desa_kelurahan)} ${renderField('Kecamatan', d.kecamatan)}</div><div class="bg-slate-50 p-3 rounded mt-2">${renderField('Tempat Tinggal Saat Saat', d.jenis_tinggal)} ${d.jenis_tinggal === 'Bersama Wali/Kerabat' ? `<div class="mt-2 grid grid-cols-2 gap-2 border-t pt-2">${renderField('Nama Wali', d.nama_wali)}${renderField('HP Wali', d.hp_wali)}${renderField('Alamat Wali', d.alamat_wali)}</div>` : ''}</div></div></div></div><div class="space-y-6"><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-users"></i> Data Orang Tua</h4><div class="mb-3 p-2 bg-yellow-50 rounded border border-yellow-200">${renderField('No. HP Utama (Kontak Darurat)', d.no_hp_ortu)}</div><div class="grid grid-cols-2 gap-4"><div><p class="text-xs font-bold text-slate-700 mb-1 border-b pb-1">Data Ayah</p>${renderField('Nama', d.nama_ayah)} ${renderField('Pekerjaan', d.pekerjaan_ayah)} ${renderField('Status', d.status_ayah)}</div><div><p class="text-xs font-bold text-slate-700 mb-1 border-b pb-1">Data Ibu</p>${renderField('Nama', d.nama_ibu)} ${renderField('Pekerjaan', d.pekerjaan_ibu)} ${renderField('Status', d.status_ibu)}</div></div></div><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-t-shirt"></i> Seragam &amp; Akademik</h4><div class="grid grid-cols-2 gap-3 mb-3">${renderField('Status Bantuan', d.status_bantuan)}<div class="col-span-2">${renderField('Entitas Pembawa', d.entitas_pembawa)}</div></div><div class="grid grid-cols-4 gap-2 border-t pt-3">${renderField('Atas OSIS', d.ukuran_atas_osis)} ${renderField('Bawah OSIS', d.ukuran_bawah_osis)} ${renderField('Atas OR', d.ukuran_atas_or)} ${renderField('Bawah OR', d.ukuran_bawah_or)}</div><div class="col-span-4 mt-2 bg-slate-50 p-2 text-xs border rounded">${renderField('Checklist Atribut Tambahan', d.atribut_lengkap.replace(/,/g, ', '))}</div></div></div></div><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm mt-6"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-folders text-amber-500"></i> Kelengkapan Dokumen Fisik</h4><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">${[ {key:'formulir', label:'Formulir'}, {key:'skl', label:'SKL'}, {key:'nilai', label:'Nilai'}, {key:'tka', label:'Hasil TKA'}, {key:'foto', label:'Foto 3x4'}, {key:'ijazah', label:'Ijazah'}, {key:'kk', label:'K. Keluarga'}, {key:'akte', label:'Akte'}, {key:'bantuan', label:'Bantuan'} ].map(k => { const val = d[`berkas_${k.key}`]; return `<div class="flex flex-col p-2 rounded ${val === 'Belum Ada' ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}"><span class="font-semibold text-xs text-slate-600 mb-1">${k.label}</span> <span class="${val === 'Belum Ada' ? 'text-red-600 font-bold text-xs' : 'text-green-600 font-semibold text-xs'}">${val}</span></div>`; }).join('')}</div></div>`;
    document.getElementById('viewModal').classList.remove('spa-hidden');
}

function editData(id) {
    const data = masterData.find(m => m.id_pendaftaran === id); if(!data) return;
    editModeId = id; 
    document.getElementById('formTitle').innerHTML = `<i class="ph-fill ph-pencil-simple text-amber-500"></i> Edit Data: ${id}`; 
    document.getElementById('btnSubmitMurid').innerHTML = `<i class="ph ph-check-circle text-xl"></i> Update Data Pendaftar`;
    
    let dusun = "", rt = "", rw = ""; 
    try { let addr = data.alamat_lengkap || ""; if(addr.includes("Dusun ") && addr.includes("RT ")) { dusun = addr.split("Dusun ")[1].split(", RT ")[0]; rt = addr.split(", RT ")[1].split("/RW ")[0]; rw = addr.split("/RW ")[1]; } } catch(e) {}
    
    document.getElementById('nama_lengkap').value = data.nama_lengkap; 
    document.getElementById('jenis_kelamin').value = data.jenis_kelamin; 
    document.getElementById('nisn').value = data.nisn; 
    document.getElementById('nik').value = data.nik; 
    document.getElementById('tempat_lahir').value = data.tempat_lahir; 
    if(data.tanggal_lahir) { try { document.getElementById('tanggal_lahir').value = new Date(data.tanggal_lahir).toISOString().split('T')[0]; } catch(e){} }
    
    document.getElementById('agama').value = data.agama; 
    document.getElementById('no_hp_murid').value = data.no_hp_murid; 
    document.getElementById('alamat_dusun').value = dusun; 
    document.getElementById('alamat_rt').value = rt; 
    document.getElementById('alamat_rw').value = rw; 
    
    // Setel Select2 dengan fungsi helper kita
    setSelect2Value('desa_kelurahan', data.desa_kelurahan);
    setSelect2Value('kecamatan', data.kecamatan);
    
    if(data.jenis_tinggal) { document.getElementById('jenis_tinggal').value = data.jenis_tinggal; toggleWali(data.jenis_tinggal); }
    
    document.getElementById('nama_wali').value = data.nama_wali; 
    document.getElementById('hp_wali').value = data.hp_wali; 
    document.getElementById('alamat_wali').value = data.alamat_wali; 
    document.getElementById('no_hp_ortu').value = data.no_hp_ortu; 
    document.getElementById('nama_ayah').value = data.nama_ayah; 
    
    setSelect2Value('pekerjaan_ayah', data.pekerjaan_ayah);
    document.getElementById('status_ayah').value = data.status_ayah; 
    document.getElementById('nama_ibu').value = data.nama_ibu; 
    setSelect2Value('pekerjaan_ibu', data.pekerjaan_ibu);
    document.getElementById('status_ibu').value = data.status_ibu; 
    setSelect2Value('asal_sekolah', data.asal_sekolah);
    
    document.getElementById('status_bantuan').value = data.status_bantuan;
    const arrEntitas = (data.entitas_pembawa || "").split(", "); 
    document.querySelectorAll('input[name="chk_entitas"]').forEach(chk => { chk.checked = arrEntitas.includes(chk.value); });
    
    ['atas_osis', 'bawah_osis', 'atas_or', 'bawah_or'].forEach(u => document.getElementById(`ukur_${u}`).value = data[`ukuran_${u}`] || '-'); 
    ['formulir', 'skl', 'nilai', 'tka', 'foto', 'ijazah', 'kk', 'akte', 'bantuan'].forEach(b => document.getElementById(`berkas_${b}`).value = data[`berkas_${b}`] || 'Belum Ada');
    switchView('form');
}

function renderTabel(data) {
    const tbody = document.getElementById('tableBody'); if(!tbody) return; tbody.innerHTML = '';
    if (data.length === 0) { tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Tidak ada data pendaftar.</td></tr>`; return; }
    let rCheck = currentUserRole.trim().toLowerCase(); let isCrud = (rCheck === "administrator" || rCheck === "admin input"); let isDewa = (rCheck === "administrator");
    data.forEach(m => { 
        let viewBtn = `<button onclick="viewData('${m.id_pendaftaran}')" class="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Resume Data Lengkap"><i class="ph ph-eye text-lg"></i></button>`;
        let editBtn = isCrud ? `<button onclick="editData('${m.id_pendaftaran}')" class="text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg transition-colors" title="Edit Data"><i class="ph ph-pencil-simple text-lg"></i></button>` : '';
        let delBtn = isDewa ? `<button onclick="deleteData('${m.id_pendaftaran}')" class="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Hapus Data"><i class="ph ph-trash text-lg"></i></button>` : '';
        let actionBtn = `<div class="flex justify-center gap-1">${viewBtn}${editBtn}${delBtn}</div>`;
        if(!isCrud && !isDewa) actionBtn = `<button onclick="viewData('${m.id_pendaftaran}')" class="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 text-xs font-bold transition-colors shadow-sm"><i class="ph ph-eye text-sm align-middle"></i> Detail</button>`;
        tbody.innerHTML += `<tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100"><td class="p-3 font-medium text-slate-600">${m.id_pendaftaran}</td><td class="p-3 font-semibold text-slate-900">${m.nama_lengkap}</td><td class="p-3 text-center text-slate-500">${m.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}</td><td class="p-3 text-slate-600">${m.desa_kelurahan || '-'}</td><td class="p-3 text-slate-600">${m.asal_sekolah || '-'}</td><td class="p-3 text-center">${actionBtn}</td></tr>`; 
    });
}

async function deleteData(id) {
    if(!confirm(`PERINGATAN! Anda yakin ingin menghapus data ${id} secara permanen? Data yang dihapus tidak bisa dikembalikan.`)) return;
    try {
        const payload = new URLSearchParams(); payload.append('action', 'delete_murid'); payload.append('id_pendaftaran', id);
        const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const r = await res.json();
        if(r.status === 'success') { showToast('Data berhasil dihapus.'); loadMasterData(false); } else showToast(r.message, 'error');
    } catch(e) { showToast('Koneksi terputus', 'error'); }
}

if(document.getElementById('searchInput')) { document.getElementById('searchInput').addEventListener('input', (e) => filterTabel(e.target.value.trim())); }

function filterTabel(keyword) {
    const infoFilter = document.getElementById('tableFilterInfo'); 
    if (!keyword) { infoFilter.innerText = "Menampilkan seluruh data murid"; renderTabel(masterData); return; }
    let filtered = [];
    if(keyword.startsWith('filter:')) { 
        let parts = keyword.split('='); let field = parts[0].split(':')[1]; let val = parts[1]; 
        filtered = masterData.filter(m => m[field] === val); infoFilter.innerHTML = `Menyaring berdasarkan <span class="font-bold text-blue-600">${val}</span>`; 
    } else if (keyword.startsWith('missing:')) { 
        const f = keyword.split(':')[1]; filtered = masterData.filter(m => m[f] === "Belum Ada"); infoFilter.innerHTML = `Menampilkan data murid dengan berkas <span class="text-red-600 font-semibold">Belum Lengkap</span>`; 
    } else { 
        const lowerKey = keyword.toLowerCase(); 
        filtered = masterData.filter(m => m.nama_lengkap.toLowerCase().includes(lowerKey) || m.id_pendaftaran.toLowerCase().includes(lowerKey) || m.asal_sekolah.toLowerCase().includes(lowerKey)); 
        infoFilter.innerText = `Ditemukan ${filtered.length} hasil pencarian.`; 
    }
    renderTabel(filtered);
}

function renderLogistik(data) {
    const tbody = document.getElementById('tableLogistikBody'); if(!tbody) return; tbody.innerHTML = '';
    let rCheck = currentUserRole.trim().toLowerCase(); let allowEdit = (rCheck === 'administrator' || rCheck === 'logistik' || rCheck === 'petugas seragam');
    data.forEach(m => {
        let dAttr = m.atribut_lengkap || ""; let attrComplete = (dAttr.split(",").length >= listAtributLogistik.length); let isLengkap = (m.status_osis === 'Sudah' && m.status_or === 'Sudah' && attrComplete); 
        let badgeColor = isLengkap ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'; let badgeText = isLengkap ? '<i class="ph-fill ph-check-circle align-middle"></i> Selesai' : 'Belum Selesai';
        let btn = allowEdit ? `<button onclick="bukaModalLogistik('${m.id_pendaftaran}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded shadow text-xs font-bold transition-colors">Distribusi</button>` : `<button onclick="bukaModalLogistik('${m.id_pendaftaran}')" class="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 text-xs font-bold transition-colors shadow-sm"><i class="ph ph-eye text-sm align-middle"></i> View</button>`;
        tbody.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="p-3"><p class="font-bold text-slate-800">${m.nama_lengkap}</p><p class="text-xs text-slate-500">${m.id_pendaftaran}</p></td><td class="p-3 text-xs"><span class="block">Atas: <b>${m.ukuran_atas_osis}</b></span><span class="block">Bawah: <b>${m.ukuran_bawah_osis}</b></span></td><td class="p-3 text-xs"><span class="block">Atas: <b>${m.ukuran_atas_or}</b></span><span class="block">Bawah: <b>${m.ukuran_bawah_or}</b></span></td><td class="p-3 text-center"><span class="px-2 py-1 rounded border text-xs font-bold ${badgeColor}">${badgeText}</span></td><td class="p-3 text-center">${btn}</td></tr>`;
    });
}
if(document.getElementById('searchLogistik')) { document.getElementById('searchLogistik').addEventListener('input', (e) => { const k = e.target.value.toLowerCase(); renderLogistik(masterData.filter(m => m.nama_lengkap.toLowerCase().includes(k) || m.id_pendaftaran.toLowerCase().includes(k))); }); }

function bukaModalLogistik(id) {
    const d = masterData.find(m => m.id_pendaftaran === id); if(!d) return; logistikId = id;
    document.getElementById('logNama').innerText = d.nama_lengkap; document.getElementById('logId').innerText = d.id_pendaftaran; 
    document.getElementById('szAo').innerText = d.ukuran_atas_osis; document.getElementById('szBo').innerText = d.ukuran_bawah_osis; document.getElementById('szAr').innerText = d.ukuran_atas_or; document.getElementById('szBr').innerText = d.ukuran_bawah_or;
    
    setSelect2Value('stat_osis', d.status_osis || 'Belum');
    setSelect2Value('stat_or', d.status_or || 'Belum');
    setSelect2Value('diserahkan_kepada', d.diserahkan_kepada === "-" ? "" : d.diserahkan_kepada);
    
    let activeAttrs = (d.atribut_lengkap || "").split(",");
    document.querySelectorAll('input[name="chk_logistik_attr"]').forEach(chk => { chk.checked = activeAttrs.includes(chk.value); });
    let rCheck = currentUserRole.trim().toLowerCase(); let allowEdit = (rCheck === 'administrator' || rCheck === 'logistik' || rCheck === 'petugas seragam');
    
    document.getElementById('stat_osis').disabled = !allowEdit; document.getElementById('stat_or').disabled = !allowEdit; document.getElementById('diserahkan_kepada').disabled = !allowEdit;
    document.querySelectorAll('input[name="chk_logistik_attr"]').forEach(chk => { chk.disabled = !allowEdit; });
    const btnSubmit = document.getElementById('btnSubmitLogistik');
    if(!allowEdit) { btnSubmit.classList.add('hidden'); } else { btnSubmit.classList.remove('hidden'); }
    document.getElementById('logistikModal').classList.remove('spa-hidden');
    initSelect2Global();
}

if(document.getElementById('formLogistik')) {
    document.getElementById('formLogistik').addEventListener('submit', async (e) => {
        e.preventDefault(); const btnSubmit = document.getElementById('btnSubmitLogistik'); const formStatus = document.getElementById('logStatus'); 
        btnSubmit.disabled = true; formStatus.innerText = "Memproses...";
        const d = masterData.find(m => m.id_pendaftaran === logistikId); const currentUser = JSON.parse(sessionStorage.getItem('spmb_session'));
        let selectedAttr = []; document.querySelectorAll('input[name="chk_logistik_attr"]:checked').forEach(c => selectedAttr.push(c.value));
        const payload = new URLSearchParams(); payload.append('action', 'update_seragam'); payload.append('id_pendaftaran', logistikId); payload.append('ukuran_atas_osis', d.ukuran_atas_osis); payload.append('ukuran_bawah_osis', d.ukuran_bawah_osis); payload.append('ukuran_atas_or', d.ukuran_atas_or); payload.append('ukuran_bawah_or', d.ukuran_bawah_or); payload.append('status_osis', document.getElementById('stat_osis').value); payload.append('status_or', document.getElementById('stat_or').value); payload.append('atribut_lengkap', selectedAttr.join(",")); payload.append('diserahkan_kepada', document.getElementById('diserahkan_kepada').value); payload.append('petugas_seragam', currentUser.nama_lengkap);
        try {
            const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const r = await res.json();
            if(r.status === 'success') { showToast('Penyerahan berhasil dicatat!'); document.getElementById('logistikModal').classList.add('spa-hidden'); loadMasterData(false); } else { showToast('Gagal: ' + r.message, 'error'); }
        } catch (err) { showToast('Terjadi kesalahan jaringan.', 'error'); } finally { btnSubmit.disabled = false; formStatus.innerText = ""; }
    });
}

document.getElementById('muridForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const btnSubmit = document.getElementById('btnSubmitMurid'); btnSubmit.disabled = true;
    let entitasTerpilih = []; document.querySelectorAll('input[name="chk_entitas"]:checked').forEach(chk => entitasTerpilih.push(chk.value)); 
    const payload = new URLSearchParams(); 
    if (editModeId) { payload.append('action', 'update_murid'); payload.append('id_pendaftaran', editModeId); } else { payload.append('action', 'insert_murid'); }
    payload.append('petugas_input', JSON.parse(sessionStorage.getItem('spmb_session')).nama_lengkap); payload.append('nama_lengkap', document.getElementById('nama_lengkap').value); payload.append('jenis_kelamin', document.getElementById('jenis_kelamin').value); payload.append('nisn', document.getElementById('nisn').value); payload.append('nik', document.getElementById('nik').value); payload.append('tempat_lahir', document.getElementById('tempat_lahir').value); payload.append('tanggal_lahir', document.getElementById('tanggal_lahir').value); payload.append('agama', document.getElementById('agama').value); payload.append('no_hp_murid', document.getElementById('no_hp_murid').value); payload.append('alamat_lengkap', `Dusun ${document.getElementById('alamat_dusun').value}, RT ${document.getElementById('alamat_rt').value}/RW ${document.getElementById('alamat_rw').value}`); payload.append('desa_kelurahan', document.getElementById('desa_kelurahan').value); payload.append('kecamatan', document.getElementById('kecamatan').value); payload.append('jenis_tinggal', document.getElementById('jenis_tinggal').value); payload.append('nama_wali', document.getElementById('nama_wali').value); payload.append('hp_wali', document.getElementById('hp_wali').value); payload.append('alamat_wali', document.getElementById('alamat_wali').value); payload.append('no_hp_ortu', document.getElementById('no_hp_ortu').value); payload.append('nama_ayah', document.getElementById('nama_ayah').value); payload.append('pekerjaan_ayah', document.getElementById('pekerjaan_ayah').value); payload.append('status_ayah', document.getElementById('status_ayah').value); payload.append('nama_ibu', document.getElementById('nama_ibu').value); payload.append('pekerjaan_ibu', document.getElementById('pekerjaan_ibu').value); payload.append('status_ibu', document.getElementById('status_ibu').value); payload.append('asal_sekolah', document.getElementById('asal_sekolah').value); payload.append('status_bantuan', document.getElementById('status_bantuan').value); payload.append('entitas_pembawa', entitasTerpilih.join(", "));
    ['atas_osis', 'bawah_osis', 'atas_or', 'bawah_or'].forEach(u => payload.append(`ukuran_${u}`, document.getElementById(`ukur_${u}`).value)); 
    ['formulir', 'skl', 'nilai', 'tka', 'foto', 'ijazah', 'kk', 'akte', 'bantuan'].forEach(b => payload.append(`berkas_${b}`, document.getElementById(`berkas_${b}`).value));
    try {
        const response = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const result = await response.json();
        if(result.status === 'success') {
            document.getElementById('modalIdPendaftar').innerText = editModeId ? editModeId : result.data.id_pendaftaran;
            if (editModeId) { document.getElementById('modalTitle').innerText = "Berhasil Diperbarui!"; document.getElementById('modalButtonsNew').classList.add('spa-hidden'); document.getElementById('modalButtonsUpdate').classList.remove('spa-hidden'); } 
            else { document.getElementById('modalTitle').innerText = "Berhasil Disimpan!"; document.getElementById('modalButtonsNew').classList.remove('spa-hidden'); document.getElementById('modalButtonsUpdate').classList.add('spa-hidden'); }
            document.getElementById('successModal').classList.remove('spa-hidden'); loadMasterData(false);
        } else showToast(result.message, 'error');
    } catch (err) { showToast('Koneksi terputus', 'error'); } finally { btnSubmit.disabled = false; }
});

document.getElementById('btnModalYa').addEventListener('click', () => { bukaFormBaru(); document.getElementById('successModal').classList.add('spa-hidden'); });
document.getElementById('btnModalTidak').addEventListener('click', () => { document.getElementById('muridForm').reset(); document.getElementById('successModal').classList.add('spa-hidden'); switchView('tabel'); });
document.getElementById('btnModalOk').addEventListener('click', () => { editModeId = null; document.getElementById('muridForm').reset(); document.getElementById('successModal').classList.add('spa-hidden'); switchView('tabel'); });

function renderVisitAndRiwayat(data) {
    const tbodyTgt = document.getElementById('tableVisitBody'); const tbodyRwt = document.getElementById('tableRiwayatVisitBody'); const tbodyHsl = document.getElementById('tableHasilVisitBody'); 
    if(tbodyTgt) tbodyTgt.innerHTML = ''; if(tbodyRwt) tbodyRwt.innerHTML = ''; if(tbodyHsl) tbodyHsl.innerHTML = '';
    const today = new Date(); today.setHours(0,0,0,0);
    let hasTarget = false, hasRiwayat = false, hasHasil = false; let noTgt = 1, noRwt = 1, noHsl = 1; let actBatasWaktu = null; let timStats = {};

    data.forEach((m) => {
        let isExpired = false, isFuture = false;
        if(m.tanggal_mulai) { const tm = new Date(m.tanggal_mulai); tm.setHours(0,0,0,0); if(today < tm) isFuture = true; }
        if(m.batas_waktu) { const bw = new Date(m.batas_waktu); bw.setHours(0,0,0,0); if(today > bw) isExpired = true; if(!isFuture && !isExpired && !actBatasWaktu) actBatasWaktu = m.batas_waktu; }

        let rCheck = currentUserRole.trim().toLowerCase();
        if(rCheck === 'administrator' || rCheck === 'kepala sekolah' || rCheck === 'ketua panitia') {
            let t = m.tim_alokasi || "Tanpa Tim"; if(!timStats[t]) timStats[t] = { total: 0, selesai: 0, belum: 0, listBelum: [] };
            timStats[t].total++;
            if(m.status_visit === 'Sudah') { timStats[t].selesai++; } else { timStats[t].belum++; timStats[t].listBelum.push({ id: m.id_visit, nama: m.nama_lengkap, lp: m.lp, desa: m.desa_kelurahan, sekolah: m.asal_sekolah }); }
        }

        if(isFuture && m.status_visit !== 'Sudah') return;

        if (m.status_visit === 'Sudah') {
            hasHasil = true;
            if(tbodyHsl) {
                tbodyHsl.innerHTML += `<tr class="hover:bg-slate-50 border-b"><td class="p-3 text-center text-slate-500">${noHsl++}</td><td class="p-3 font-semibold text-slate-800">${m.nama_lengkap}</td><td class="p-3 text-center">${m.lp}</td><td class="p-3 text-slate-600">${m.asal_sekolah}</td><td class="p-3">${m.nama_ayah || '-'}</td><td class="p-3">${m.nama_ibu || '-'}</td><td class="p-3 text-xs max-w-[150px] truncate" title="${m.alamat}">${m.alamat}</td><td class="p-3 text-xs text-blue-600 font-semibold">${m.pilihan_1 || '-'}</td><td class="p-3 text-xs">${m.pilihan_2 || '-'}</td><td class="p-3 text-xs">${m.pilihan_3 || '-'}</td><td class="p-3 text-xs max-w-[150px] truncate" title="${m.keterangan}">${m.keterangan || '-'}</td></tr>`;
            }
        } else if (isExpired) {
            hasRiwayat = true;
            if(tbodyRwt) {
                let statBadge = `<span class="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded border border-red-200"><i class="ph-fill ph-warning-circle"></i> Belum Tervisit</span>`;
                let aksiBtn = `<button onclick="bukaLaporVisit('${m.id_visit}', '${m.nama_lengkap}', '${m.tim_alokasi}')" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm transition-colors"><i class="ph ph-note-pencil mr-1 align-middle"></i>Lapor</button>`;
                tbodyRwt.innerHTML += `<tr class="hover:bg-slate-50 border-b"><td class="p-3 text-center text-slate-500">${noRwt++}</td><td class="p-3 font-semibold text-slate-800">${m.nama_lengkap}</td><td class="p-3 text-center">${m.lp}</td><td class="p-3 text-slate-600">${m.asal_sekolah}</td><td class="p-3">${m.nama_ayah || '-'}</td><td class="p-3">${m.nama_ibu || '-'}</td><td class="p-3 text-xs max-w-[150px] truncate" title="${m.alamat}">${m.alamat}</td><td class="p-3 text-center">${statBadge}</td><td class="p-3 text-center">${aksiBtn}</td></tr>`;
            }
        } else {
            hasTarget = true;
            if(tbodyTgt) {
                tbodyTgt.innerHTML += `<tr class="hover:bg-slate-50 border-b"><td class="p-3 text-center text-slate-500">${noTgt++}</td><td class="p-3 font-semibold text-slate-800">${m.nama_lengkap}</td><td class="p-3 text-center">${m.lp}</td><td class="p-3 text-slate-600">${m.asal_sekolah}</td><td class="p-3">${m.nama_ayah || '-'}</td><td class="p-3">${m.nama_ibu || '-'}</td><td class="p-3 text-xs max-w-[200px] truncate" title="${m.alamat}">${m.alamat}</td><td class="p-3 text-center"><button onclick="bukaLaporVisit('${m.id_visit}', '${m.nama_lengkap}', '${m.tim_alokasi}')" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm transition-colors"><i class="ph ph-note-pencil mr-1 align-middle"></i>Lapor</button></td></tr>`;
            }
        }
    });

    if(!hasTarget && tbodyTgt) tbodyTgt.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">Tidak ada target visitasi aktif sesuai jadwal.</td></tr>`;
    if(!hasRiwayat && tbodyRwt) tbodyRwt.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-400">Belum ada riwayat (tenggat) visitasi.</td></tr>`;
    if(!hasHasil && tbodyHsl) tbodyHsl.innerHTML = `<tr><td colspan="11" class="p-8 text-center text-slate-400">Belum ada data hasil visitasi.</td></tr>`;
    
    let rCheck = currentUserRole.trim().toLowerCase();
    let labelTim = (rCheck === 'administrator' || rCheck === 'kepala sekolah' || rCheck === 'ketua panitia') ? "Semua Tim (Monitoring)" : currentUserTeam;
    let batasText = actBatasWaktu ? new Date(actBatasWaktu).toLocaleDateString('id-ID') : 'Tanpa Batas';
    
    if(document.getElementById('visitTeamLabel')) { document.getElementById('visitTeamLabel').innerHTML = `Alokasi Wilayah: <span class="font-bold mr-3 text-purple-700">${labelTim}</span>  Batas Waktu Target Aktif: <span class="font-bold text-red-500">${batasText}</span>`; }
    if(document.getElementById('riwayatInfoLabel')) { document.getElementById('riwayatInfoLabel').innerHTML = `Berisi data target yang sudah melewati batas waktu dan belum dilaporkan.`; }

    if(rCheck === 'administrator') {
        const vContainer = document.getElementById('visitStatsContainer');
        if(vContainer) {
            vContainer.innerHTML = ''; window.tempTimStats = timStats;
            Object.keys(timStats).forEach(t => {
                let btnHtml = timStats[t].belum > 0 ? `<button onclick="showDetailVisitTeam('${t}')" class="w-full mt-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold py-1 rounded transition-colors">Lihat Sisa Target</button>` : `<div class="w-full mt-2 text-center text-xs text-green-600 font-bold py-1"><i class="ph-fill ph-check-circle align-middle"></i> Selesai Semua</div>`;
                vContainer.innerHTML += `<div class="bg-white p-4 border border-slate-200 rounded-xl shadow-sm border-l-4 border-l-purple-500"><h4 class="font-bold text-slate-800 mb-2">${t}</h4><div class="flex justify-between text-sm"><span class="text-slate-500">Selesai:</span> <span class="font-bold text-green-600">${timStats[t].selesai}</span></div><div class="flex justify-between text-sm"><span class="text-slate-500">Sisa Target:</span> <span class="font-bold text-red-500">${timStats[t].belum}</span></div><div class="mt-2 pt-2 border-t text-xs text-slate-400 mb-2">Total Alokasi: ${timStats[t].total} Data</div>${btnHtml}</div>`;
            });
        }
    }
}

function showDetailVisitTeam(teamName) {
    const list = window.tempTimStats[teamName].listBelum; window.tempDataGlobal["visit_" + teamName] = list; showDetailTable("Sisa Target Visit: " + teamName, "visit_" + teamName);
}

if(document.getElementById('searchVisit')) { document.getElementById('searchVisit').addEventListener('input', (e) => { const k = e.target.value.toLowerCase(); renderVisitAndRiwayat(visitData.filter(m => m.nama_lengkap.toLowerCase().includes(k) || m.asal_sekolah.toLowerCase().includes(k))); }); }
if(document.getElementById('searchRiwayatVisit')) { document.getElementById('searchRiwayatVisit').addEventListener('input', (e) => { const k = e.target.value.toLowerCase(); renderVisitAndRiwayat(visitData.filter(m => m.nama_lengkap.toLowerCase().includes(k) || m.asal_sekolah.toLowerCase().includes(k))); }); }
if(document.getElementById('searchHasilVisit')) { document.getElementById('searchHasilVisit').addEventListener('input', (e) => { const k = e.target.value.toLowerCase(); renderVisitAndRiwayat(visitData.filter(m => m.nama_lengkap.toLowerCase().includes(k) || m.asal_sekolah.toLowerCase().includes(k))); }); }

function bukaLaporVisit(id, nama, timAlokasi) {
    selectedVisitId = id; document.getElementById('visitNamaLabel').innerText = nama; document.getElementById('formLaporVisit').dataset.tim = timAlokasi;
    document.getElementById('formLaporVisit').reset(); toggleSekolahLain(""); document.getElementById('laporVisitModal').classList.remove('spa-hidden');
    initSelect2Global();
}

function toggleSekolahLain(val) { 
    const area = document.getElementById('areaSekolahLain'); 
    if(val === "Sekolah Lain") area.classList.remove('hidden'); else area.classList.add('hidden'); 
    if (typeof $ !== 'undefined') $('select').trigger('change');
}

if(document.getElementById('formLaporVisit')) {
    document.getElementById('formLaporVisit').addEventListener('submit', async (e) => {
        e.preventDefault(); const btn = document.getElementById('btnSubmitVisit'); const stat = document.getElementById('visitStatusTxt');
        btn.disabled = true; stat.innerHTML = "Mengirim..."; 
        const user = JSON.parse(sessionStorage.getItem('spmb_session')); const timAnak = document.getElementById('formLaporVisit').dataset.tim;
        const payload = new URLSearchParams(); payload.append('action', 'submit_laporan_visit'); payload.append('id_visit', selectedVisitId); payload.append('petugas', user.nama_lengkap + " (" + user.role + ")"); payload.append('tim_asal', timAnak); payload.append('hasil', document.getElementById('hasil_visit').value); payload.append('keterangan', document.getElementById('keterangan_visit').value);
        if(document.getElementById('hasil_visit').value === "Sekolah Lain") { payload.append('pilihan_1', document.getElementById('pil_1').value); payload.append('pilihan_2', document.getElementById('pil_2').value); payload.append('pilihan_3', document.getElementById('pil_3').value); }
        try {
            const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const r = await res.json();
            if(r.status === 'success') { showToast('Laporan berhasil dikirim!', 'success'); document.getElementById('laporVisitModal').classList.add('spa-hidden'); loadVisitData(false); if(document.getElementById('hasil_visit').value === "Langsung Mendaftar") loadMasterData(false); } else { showToast(r.message, 'error'); }
        } catch (err) { showToast('Terjadi kesalahan jaringan.', 'error'); } finally { btn.disabled = false; stat.innerHTML = `<i class="ph ph-paper-plane-right align-middle mr-1"></i> Kirim Laporan`; }
    });
}

async function loadUsersData() {
    try {
        const res = await fetch(SCRIPT_URL.trim() + "?action=get_users"); const r = await res.json();
        if(r.status === 'success') {
            const tbody = document.getElementById('tableUsersBody'); tbody.innerHTML = ''; let rolesData = {}; let activeCount = r.data.length;
            r.data.forEach(u => { rolesData[u.role] = (rolesData[u.role] || 0) + 1; tbody.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="p-3 font-semibold">${u.username}</td><td class="p-3">${u.nama}</td><td class="p-3"><span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">${u.role}</span></td><td class="p-3">${u.tim || '-'}</td><td class="p-3 text-center whitespace-nowrap"><button type="button" onclick="editUser('${u.username}', '${u.password}', '${u.nama}', '${u.role}', '${u.tim}')" class="text-amber-500 hover:text-amber-700 bg-amber-50 p-1.5 rounded mr-1"><i class="ph ph-pencil-simple text-lg"></i></button><button type="button" onclick="deleteUser('${u.username}')" class="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"><i class="ph ph-trash text-lg"></i></button></td></tr>`; });
            const uStats = document.getElementById('usersStatsContainer');
            if(uStats) { uStats.innerHTML = `<div class="bg-slate-800 p-4 border border-slate-700 rounded-xl shadow-sm"><p class="text-xs text-slate-300 font-bold uppercase tracking-wider">Total Pengguna</p><h4 class="text-3xl font-bold text-white mt-1">${activeCount}</h4></div>`; Object.keys(rolesData).forEach(role => { uStats.innerHTML += `<div class="bg-white p-4 border border-slate-200 rounded-xl shadow-sm"><p class="text-xs text-slate-500 font-bold uppercase tracking-wider">${role}</p><h4 class="text-2xl font-bold text-blue-600 mt-1">${rolesData[role]}</h4></div>`; }); }
        }
    } catch(e) {}
}

if(document.getElementById('formAddUser')) {
    document.getElementById('formAddUser').addEventListener('submit', async(e) => {
        e.preventDefault(); const btn = document.getElementById('btnSaveUser'); btn.disabled = true; btn.innerText="Loading...";
        const payload = new URLSearchParams(); payload.append('action', 'save_user'); payload.append('u_username', document.getElementById('u_username').value); payload.append('u_password', document.getElementById('u_password').value); payload.append('u_nama', document.getElementById('u_nama').value); payload.append('u_role', document.getElementById('u_role').value); payload.append('u_tim', document.getElementById('u_tim').value);
        try {
            const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); const r = await res.json();
            if(r.status === 'success') { showToast('Pengguna berhasil ditambah!'); document.getElementById('formAddUser').reset(); loadUsersData(); } else showToast(r.message, 'error');
        } catch(e) { showToast('Error koneksi', 'error'); } finally { btn.disabled = false; btn.innerText="Buat User"; }
    });
}

function editUser(username, password, nama, role, tim) {
    document.getElementById('edit_old_username').value = username; document.getElementById('edit_u_username').value = username; document.getElementById('edit_u_password').value = password; document.getElementById('edit_u_nama').value = nama;
    setSelect2Value('edit_u_role', role);
    document.getElementById('edit_u_tim').value = tim === '-' ? '' : tim; document.getElementById('modalEditUser').classList.remove('spa-hidden');
    initSelect2Global();
}

if(document.getElementById('formEditUserLogic')) {
    document.getElementById('formEditUserLogic').addEventListener('submit', async(e) => {
        e.preventDefault(); const btn = document.getElementById('btnUpdateUser'); btn.disabled = true; btn.innerText="Menyimpan...";
        const payload = new URLSearchParams(); payload.append('action', 'update_user'); payload.append('old_username', document.getElementById('edit_old_username').value); payload.append('u_username', document.getElementById('edit_u_username').value); payload.append('u_password', document.getElementById('edit_u_password').value); payload.append('u_nama', document.getElementById('edit_u_nama').value); payload.append('u_role', document.getElementById('edit_u_role').value); payload.append('u_tim', document.getElementById('edit_u_tim').value);
        try {
            const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); const r = await res.json();
            if(r.status === 'success') { showToast('Pengguna berhasil diubah!'); document.getElementById('modalEditUser').classList.add('spa-hidden'); loadUsersData(); } else showToast(r.message, 'error');
        } catch(e) { showToast('Error koneksi', 'error'); } finally { btn.disabled = false; btn.innerText="Simpan Perubahan"; }
    });
}

async function deleteUser(username) {
    if(!confirm(`PERINGATAN! Anda yakin ingin menghapus akses login untuk: ${username}?`)) return;
    const payload = new URLSearchParams(); payload.append('action', 'delete_user'); payload.append('u_username', username);
    try {
        const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); const r = await res.json();
        if(r.status === 'success') { showToast('Pengguna berhasil dihapus!'); loadUsersData(); } else showToast(r.message, 'error');
    } catch(e) { showToast('Koneksi terputus', 'error'); }
}
