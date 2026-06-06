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

// ==========================================
// AUTO LOGOUT & SESSION
// ==========================================
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
            Swal.fire({
                icon: 'warning',
                title: 'Sesi Berakhir',
                text: 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit.'
            });
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

// Event Handler: Buka Modal Profil & Form Update Profil
if(document.getElementById('btnOpenProfile')){
    document.getElementById('btnOpenProfile').addEventListener('click', () => {
        const userStr = sessionStorage.getItem('spmb_session');
        if(!userStr) return;
        const user = JSON.parse(userStr);
        document.getElementById('profNama').innerText = user.nama_lengkap;
        document.getElementById('profRole').innerText = user.role;
        document.getElementById('prof_foto_url').value = user.foto_profil || "";
        document.getElementById('prof_new_pass').value = "";
        document.getElementById('previewFotoProfil').src = user.foto_profil || 'https://ui-avatars.com/api/?name=' + user.nama_lengkap + '&background=random';
        document.getElementById('modalProfile').classList.remove('spa-hidden');
    });
}

if(document.getElementById('formProfile')){
    document.getElementById('formProfile').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPass = document.getElementById('prof_new_pass').value;
        const fotoUrl = document.getElementById('prof_foto_url').value;
        
        Swal.fire({
            title: 'Memperbarui Profil...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
        
        const user = JSON.parse(sessionStorage.getItem('spmb_session'));
        const payload = new URLSearchParams();
        payload.append('action', 'update_profile');
        payload.append('username', user.username);
        payload.append('new_password', newPass);
        payload.append('foto_profil', fotoUrl);

        try {
            const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload });
            const r = await res.json();
            if(r.status === 'success') {
                sessionStorage.setItem('spmb_session', JSON.stringify(r.data));
                tampilkanApp(r.data);
                document.getElementById('modalProfile').classList.add('spa-hidden');
                Swal.fire('Berhasil!', 'Profil Anda telah diperbarui.', 'success');
            } else {
                Swal.fire('Gagal', r.message, 'error');
            }
        } catch(err) {
            Swal.fire('Error', 'Gagal menghubungi server.', 'error');
        }
    });
}

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
    
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    
    if(!usernameInput || !passwordInput) {
        Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Username dan Password wajib diisi!' });
        return;
    }
    
    Swal.fire({
        title: 'Menghubungkan...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
    
    try {
        const fd = new URLSearchParams(); 
        fd.append('action', 'login'); 
        fd.append('username', usernameInput); 
        fd.append('password', passwordInput);
        
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
            Swal.close();
            tampilkanApp(result.data); 
            startAutoSync(); 
        } else { 
            Swal.fire({ icon: 'error', title: 'Login Gagal', text: result.message });
        } 
    } catch (err) { 
        Swal.fire({ icon: 'error', title: 'Koneksi Bermasalah', text: err.message });
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
    
    if(userData.foto_profil && userData.foto_profil.trim() !== "") {
        document.getElementById('sidebarAvatarIcon').classList.add('hidden');
        const img = document.getElementById('sidebarAvatar');
        img.src = userData.foto_profil;
        img.classList.remove('hidden');
    }

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
        
        Swal.fire({
            title: 'Menyimpan Pengaturan...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
        
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
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Pengaturan tersimpan!' });
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
            } else {
                Swal.fire({ icon: 'error', title: 'Gagal', text: r.message });
            }
        } catch(err) { 
            Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal terhubung ke Server' });
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
            
            populate('desa_kelurahan', result.data.desa); 
            populate('v_desa', result.data.desa); 
            populate('asal_sekolah', result.data.sekolah); 
            populate('v_sd', result.data.sekolah); 
            populate('v_tim', result.data.tim); 
            populate('kecamatan', result.data.kecamatan); 
            populate('v_kecamatan', result.data.kecamatan);
            populate('pekerjaan_ayah', result.data.pekerjaan); 
            populate('pekerjaan_ibu', result.data.pekerjaan);
            
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
            if (qUtama === "") {
                try { renderTabel(masterData); } catch(e){}
            }

            let qLog = document.getElementById('searchLogistik') ? document.getElementById('searchLogistik').value.trim() : "";
            if (qLog === "") {
                try { renderLogistik(masterData); } catch(e){}
            }
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

// Event Delegation untuk Tombol Lapor (Mengatasi Bug Nama dgn Tanda Kutip dan Spasi)
if (typeof $ !== 'undefined') {
    $(document).on('click', '.btn-lapor-visit', function(e) {
        e.preventDefault();
        let id = $(this).attr('data-id');
        let nama = $(this).attr('data-nama');
        let tim = $(this).attr('data-tim');
        
        selectedVisitId = id; 
        document.getElementById('visitNamaLabel').innerText = nama; 
        document.getElementById('formLaporVisit').dataset.tim = tim;
        
        document.getElementById('formLaporVisit').reset(); 
        toggleSekolahLain(""); 
        document.getElementById('laporVisitModal').classList.remove('spa-hidden');
        initSelect2Global();
    });
}

function toggleSekolahLain(val) { 
    const area = document.getElementById('areaSekolahLain'); 
    if(val === "Sekolah Lain") area.classList.remove('hidden'); 
    else area.classList.add('hidden'); 
    if (typeof $ !== 'undefined') $('select').trigger('change');
}

if(document.getElementById('formLaporVisit')) {
    document.getElementById('formLaporVisit').addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        Swal.fire({
            title: 'Mengirim Laporan...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
        
        const user = JSON.parse(sessionStorage.getItem('spmb_session'));
        const timAnak = document.getElementById('formLaporVisit').dataset.tim;

        const payload = new URLSearchParams(); 
        payload.append('action', 'submit_laporan_visit'); 
        payload.append('id_visit', selectedVisitId);
        payload.append('petugas', user.nama_lengkap + " (" + user.role + ")"); 
        payload.append('tim_asal', timAnak); 
        payload.append('hasil', document.getElementById('hasil_visit').value); 
        payload.append('keterangan', document.getElementById('keterangan_visit').value);
        
        if(document.getElementById('hasil_visit').value === "Sekolah Lain") { 
            payload.append('pilihan_1', document.getElementById('pil_1').value); 
            payload.append('pilihan_2', document.getElementById('pil_2').value); 
            payload.append('pilihan_3', document.getElementById('pil_3').value); 
        }

        try {
            const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); 
            const r = await res.json();
            
            if(r.status === 'success') { 
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Laporan berhasil dikirim!' });
                document.getElementById('laporVisitModal').classList.add('spa-hidden'); 
                loadVisitData(false); 
                if(document.getElementById('hasil_visit').value === "Langsung Mendaftar") loadMasterData(false); 
            } else { 
                Swal.fire({ icon: 'error', title: 'Gagal', text: r.message });
            }
        } catch (err) { 
            Swal.fire({ icon: 'error', title: 'Error Jaringan', text: 'Gagal menghubungi server.' });
        }
    });
}

async function loadUsersData() {
    try {
        const res = await fetch(SCRIPT_URL.trim() + "?action=get_users"); 
        const r = await res.json();
        
        if(r.status === 'success') {
            const tbody = document.getElementById('tableUsersBody'); 
            tbody.innerHTML = '';
            
            let rolesData = {}; 
            let activeCount = r.data.length;
            
            r.data.forEach(u => {
                rolesData[u.role] = (rolesData[u.role] || 0) + 1;
                tbody.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="p-3 font-semibold">${u.username}</td><td class="p-3">${u.nama}</td><td class="p-3"><span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">${u.role}</span></td><td class="p-3">${u.tim || '-'}</td><td class="p-3 text-center whitespace-nowrap"><button type="button" onclick="editUser('${u.username}', '${u.password}', '${u.nama}', '${u.role}', '${u.tim}')" class="text-amber-500 hover:text-amber-700 bg-amber-50 p-1.5 rounded mr-1"><i class="ph ph-pencil-simple text-lg"></i></button><button type="button" onclick="deleteUser('${u.username}')" class="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"><i class="ph ph-trash text-lg"></i></button></td></tr>`;
            });
            
            const uStats = document.getElementById('usersStatsContainer');
            if(uStats) {
                uStats.innerHTML = `<div class="bg-slate-800 p-4 border border-slate-700 rounded-xl shadow-sm"><p class="text-xs text-slate-300 font-bold uppercase tracking-wider">Total Pengguna</p><h4 class="text-3xl font-bold text-white mt-1">${activeCount}</h4></div>`;
                Object.keys(rolesData).forEach(role => {
                    uStats.innerHTML += `<div class="bg-white p-4 border border-slate-200 rounded-xl shadow-sm"><p class="text-xs text-slate-500 font-bold uppercase tracking-wider">${role}</p><h4 class="text-2xl font-bold text-blue-600 mt-1">${rolesData[role]}</h4></div>`;
                });
            }
        }
    } catch(e) {}
}

if(document.getElementById('formAddUser')) {
    document.getElementById('formAddUser').addEventListener('submit', async(e) => {
        e.preventDefault(); 
        Swal.fire({ title: 'Membuat User...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
        
        const payload = new URLSearchParams(); 
        payload.append('action', 'save_user'); 
        payload.append('u_username', document.getElementById('u_username').value); 
        payload.append('u_password', document.getElementById('u_password').value); 
        payload.append('u_nama', document.getElementById('u_nama').value); 
        payload.append('u_role', document.getElementById('u_role').value); 
        payload.append('u_tim', document.getElementById('u_tim').value);
        
        try {
            const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); 
            const r = await res.json();
            
            if(r.status === 'success') { 
                Swal.fire('Berhasil!', 'Pengguna berhasil ditambah!', 'success'); 
                document.getElementById('formAddUser').reset(); 
                loadUsersData(); 
            } else {
                Swal.fire('Gagal', r.message, 'error');
            }
        } catch(e) { 
            Swal.fire('Error', 'Error koneksi', 'error'); 
        }
    });
}

function editUser(username, password, nama, role, tim) {
    document.getElementById('edit_old_username').value = username;
    document.getElementById('edit_u_username').value = username;
    document.getElementById('edit_u_password').value = password;
    document.getElementById('edit_u_nama').value = nama;
    setSelect2Value('edit_u_role', role);
    document.getElementById('edit_u_tim').value = tim === '-' ? '' : tim;
    document.getElementById('modalEditUser').classList.remove('spa-hidden');
    initSelect2Global();
}

if(document.getElementById('formEditUserLogic')) {
    document.getElementById('formEditUserLogic').addEventListener('submit', async(e) => {
        e.preventDefault(); 
        Swal.fire({ title: 'Menyimpan Perubahan...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
        
        const payload = new URLSearchParams(); 
        payload.append('action', 'update_user'); 
        payload.append('old_username', document.getElementById('edit_old_username').value); 
        payload.append('u_username', document.getElementById('edit_u_username').value); 
        payload.append('u_password', document.getElementById('edit_u_password').value); 
        payload.append('u_nama', document.getElementById('edit_u_nama').value); 
        payload.append('u_role', document.getElementById('edit_u_role').value); 
        payload.append('u_tim', document.getElementById('edit_u_tim').value);
        
        try {
            const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); 
            const r = await res.json();
            
            if(r.status === 'success') { 
                Swal.fire('Berhasil!', 'Data Pengguna berhasil diubah!', 'success'); 
                document.getElementById('modalEditUser').classList.add('spa-hidden'); 
                loadUsersData(); 
            } else {
                Swal.fire('Gagal', r.message, 'error');
            }
        } catch(e) { 
            Swal.fire('Error', 'Error koneksi', 'error'); 
        }
    });
}

async function deleteUser(username) {
    const result = await Swal.fire({
        title: 'Hapus User?', 
        text: `Anda yakin ingin menghapus akses login untuk: ${username}?`, 
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonColor: '#ef4444', 
        cancelButtonColor: '#64748b', 
        confirmButtonText: 'Ya, Hapus!'
    });
    
    if (!result.isConfirmed) return;
    
    Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
    
    const payload = new URLSearchParams(); 
    payload.append('action', 'delete_user'); 
    payload.append('u_username', username);
    try {
        const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); 
        const r = await res.json();
        if(r.status === 'success') { 
            Swal.fire('Terhapus!', 'Pengguna berhasil dihapus!', 'success'); 
            loadUsersData(); 
        } else {
            Swal.fire('Gagal', r.message, 'error');
        }
    } catch(e) { 
        Swal.fire('Error', 'Koneksi terputus', 'error'); 
    }
}
