// ========================================================
// KONFIGURASI UTAMA
// ========================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxeLmwjgrv39zeSr5pYhuXGKpngkhfLmlFanwhuq9fe-mxd6rKErI2491D3cF5yAvMv/exec";

let masterData = [], visitData = [], stockData = [];
let editModeId = null, logistikId = null, selectedVisitId = null;
let currentUserTeam = "", currentUserRole = "";

const listAtributLogistik = [
    "Topi", "Dasi", "Ikat Pinggang", "Bet Identitas", "Bet Nama OSIS", 
    "Bet Nama Identitas", "Bet Nama Pramuka", "Bet Nama Sekolah", 
    "Kerudung OSIS", "Kerudung Olahraga", "Kerudung Identitas", "Kerudung Pramuka"
];
const baseItemsLogistik = ["Atasan OSIS", "Bawahan OSIS", "Atasan Olahraga", "Bawahan Olahraga", ...listAtributLogistik];

// ========================================================
// UI KONTROL (SIDEBAR & TOAST)
// ========================================================
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

window.closeMenu = function() { 
    if(sidebar) sidebar.classList.add('-translate-x-full'); 
    if(sidebarOverlay) sidebarOverlay.classList.add('hidden'); 
};

if(document.getElementById('btnOpenSidebar')) {
    document.getElementById('btnOpenSidebar').addEventListener('click', () => { 
        if(sidebar) sidebar.classList.remove('-translate-x-full'); 
        if(sidebarOverlay) sidebarOverlay.classList.remove('hidden'); 
    });
}
if(document.getElementById('btnCloseSidebar')) document.getElementById('btnCloseSidebar').addEventListener('click', window.closeMenu);
if(sidebarOverlay) sidebarOverlay.addEventListener('click', window.closeMenu);

window.showToast = function(message, type = 'success') {
    if (typeof Swal !== 'undefined') {
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }).fire({ icon: type, title: message });
    } else alert(message);
};

// ========================================================
// SESSION & PASSWORD VISIBILITY
// ========================================================
const IDLE_TIMEOUT = 15 * 60 * 1000;
function resetIdleTimer() { 
    const lv = document.getElementById('loginView'); 
    if(!lv || !lv.classList.contains('spa-hidden')) return; 
    sessionStorage.setItem('lastActiveTime', Date.now()); 
}
function checkIdleTime() {
    const lv = document.getElementById('loginView');
    if(lv && lv.classList.contains('spa-hidden')) {
        const lastAct = sessionStorage.getItem('lastActiveTime');
        if (lastAct && (Date.now() - parseInt(lastAct) >= IDLE_TIMEOUT)) {
            const btnLogout = document.getElementById('btnLogout');
            if(btnLogout) btnLogout.click();
            if(typeof Swal !== 'undefined') Swal.fire('Sesi Berakhir', 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit.', 'warning');
        }
    }
}
setInterval(checkIdleTime, 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkIdleTime(); });
['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(evt => document.addEventListener(evt, resetIdleTimer));

if(document.getElementById('togglePassword')) {
    document.getElementById('togglePassword').addEventListener('click', function() {
        const pwd = document.getElementById('password'); const icon = document.getElementById('eyeIcon');
        if(!pwd || !icon) return;
        if(pwd.type === 'password') { pwd.type = 'text'; icon.classList.replace('ph-eye', 'ph-eye-slash'); } 
        else { pwd.type = 'password'; icon.classList.replace('ph-eye-slash', 'ph-eye'); }
    });
}

// ========================================================
// SWITCH VIEW & SELECT2
// ========================================================
window.switchView = function(viewName) {
    const views = ['viewDashboard', 'viewTabel', 'viewForm', 'viewKelolaVisit', 'viewStokLogistik', 'viewLogistik', 'viewVisitGuru', 'viewHasilVisit', 'viewRiwayatVisit', 'viewSettings'];
    views.forEach(v => { const el = document.getElementById(v); if(el) el.classList.add('spa-hidden'); });
    const navs = ['navDashboard', 'navTabel', 'navKelolaVisit', 'navStokLogistik', 'navLogistik', 'navVisitGuru', 'navHasilVisit', 'navRiwayatVisit', 'navSettings'];
    navs.forEach(n => { const el = document.getElementById(n); if(el) el.classList.remove('bg-blue-50','text-blue-700'); });
    
    const vTgt = document.getElementById('view' + viewName.charAt(0).toUpperCase() + viewName.slice(1)); if(vTgt) vTgt.classList.remove('spa-hidden');
    const nTgt = document.getElementById('nav' + viewName.charAt(0).toUpperCase() + viewName.slice(1)); if(nTgt) nTgt.classList.add('bg-blue-50','text-blue-700');
    if(window.innerWidth < 768) window.closeMenu();
};

window.initSelect2Global = function() {
    if (typeof $ !== 'undefined') {
        const selects = ['#asal_sekolah', '#desa_kelurahan', '#kecamatan', '#pekerjaan_ayah', '#pekerjaan_ibu', '#v_sd', '#v_desa', '#v_kecamatan', '#diserahkan_kepada', '#hasil_visit', '#pil_1', '#pil_2', '#pil_3'];
        selects.forEach(sel => {
            if ($(sel).length) {
                let parentModal = $(sel).closest('.fixed');
                let isTags = ['#pekerjaan_ayah', '#pekerjaan_ibu', '#kecamatan', '#v_kecamatan'].includes(sel);
                $(sel).select2({ width: '100%', dropdownParent: parentModal.length ? parentModal : $(document.body), tags: isTags });
            }
        });
    }
};

window.setSelect2Value = function(id, value) {
    if (typeof $ === 'undefined') return; let el = $('#' + id); if (!el.length) return;
    if (!value || value === "-" || value === "") { el.val('').trigger('change'); return; }
    if (el.find("option[value='" + value + "']").length) { el.val(value).trigger('change'); } 
    else { var newOpt = new Option(value, value, true, true); el.append(newOpt).trigger('change'); } 
};

// ========================================================
// CORE: PENDAFTAR MURID BARU & EDIT DATA
// ========================================================
window.toggleWali = function(status) {
    const formWali = document.getElementById('formWali'); if(!formWali) return;
    if (status === "Bersama Wali/Kerabat") { formWali.classList.remove('hidden'); } 
    else { formWali.classList.add('hidden'); if(document.getElementById('nama_wali')) document.getElementById('nama_wali').value = ''; if(document.getElementById('hp_wali')) document.getElementById('hp_wali').value = ''; if(document.getElementById('alamat_wali')) document.getElementById('alamat_wali').value = ''; }
};

window.bukaFormBaru = function() {
    editModeId = null; const form = document.getElementById('muridForm'); if(form) form.reset(); 
    document.querySelectorAll('input[name="chk_entitas"]').forEach(c => c.checked = false); 
    window.toggleWali('Bersama Orang Tua'); 
    const fTitle = document.getElementById('formTitle'); if(fTitle) fTitle.innerHTML = `<i class="ph-fill ph-file-plus text-blue-600"></i> Input Pendaftaran Murid Baru`; 
    const btnSubmit = document.getElementById('btnSubmitMurid'); if(btnSubmit) btnSubmit.innerHTML = `<i class="ph ph-floppy-disk text-xl"></i> Simpan Data Pendaftar`; 
    window.switchView('form'); if (typeof $ !== 'undefined') $('select').trigger('change');
};

const muridForm = document.getElementById('muridForm');
if(muridForm) {
    muridForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const btnSubmit = document.getElementById('btnSubmitMurid'); 
        if(btnSubmit) btnSubmit.disabled = true;
        
        if(typeof Swal !== 'undefined') Swal.fire({ title: 'Menyimpan Data...', text: 'Mohon tunggu sebentar', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
        
        let entitasTerpilih = []; document.querySelectorAll('input[name="chk_entitas"]:checked').forEach(chk => entitasTerpilih.push(chk.value)); 
        const payload = new URLSearchParams(); 
        if (editModeId) { payload.append('action', 'update_murid'); payload.append('id_pendaftaran', editModeId); } else { payload.append('action', 'insert_murid'); }
        
        let sess = sessionStorage.getItem('spmb_session'); let petugasName = sess ? JSON.parse(sess).nama_lengkap : "Unknown";
        payload.append('petugas_input', petugasName); 
        payload.append('nama_lengkap', document.getElementById('nama_lengkap') ? document.getElementById('nama_lengkap').value : ""); 
        payload.append('jenis_kelamin', document.getElementById('jenis_kelamin') ? document.getElementById('jenis_kelamin').value : ""); 
        payload.append('nisn', document.getElementById('nisn') ? document.getElementById('nisn').value : ""); 
        payload.append('nik', document.getElementById('nik') ? document.getElementById('nik').value : ""); 
        payload.append('tempat_lahir', document.getElementById('tempat_lahir') ? document.getElementById('tempat_lahir').value : ""); 
        payload.append('tanggal_lahir', document.getElementById('tanggal_lahir') ? document.getElementById('tanggal_lahir').value : ""); 
        payload.append('agama', document.getElementById('agama') ? document.getElementById('agama').value : ""); 
        payload.append('no_hp_murid', document.getElementById('no_hp_murid') ? document.getElementById('no_hp_murid').value : ""); 
        
        let dusun = document.getElementById('alamat_dusun') ? document.getElementById('alamat_dusun').value : ""; 
        let rt = document.getElementById('alamat_rt') ? document.getElementById('alamat_rt').value : ""; 
        let rw = document.getElementById('alamat_rw') ? document.getElementById('alamat_rw').value : "";
        payload.append('alamat_lengkap', `Dusun ${dusun}, RT ${rt}/RW ${rw}`); 
        
        payload.append('desa_kelurahan', document.getElementById('desa_kelurahan') ? document.getElementById('desa_kelurahan').value : ""); 
        payload.append('kecamatan', document.getElementById('kecamatan') ? document.getElementById('kecamatan').value : ""); 
        payload.append('jenis_tinggal', document.getElementById('jenis_tinggal') ? document.getElementById('jenis_tinggal').value : ""); 
        payload.append('nama_wali', document.getElementById('nama_wali') ? document.getElementById('nama_wali').value : ""); 
        payload.append('hp_wali', document.getElementById('hp_wali') ? document.getElementById('hp_wali').value : ""); 
        payload.append('alamat_wali', document.getElementById('alamat_wali') ? document.getElementById('alamat_wali').value : ""); 
        payload.append('no_hp_ortu', document.getElementById('no_hp_ortu') ? document.getElementById('no_hp_ortu').value : ""); 
        payload.append('nama_ayah', document.getElementById('nama_ayah') ? document.getElementById('nama_ayah').value : ""); 
        payload.append('pekerjaan_ayah', document.getElementById('pekerjaan_ayah') ? document.getElementById('pekerjaan_ayah').value : ""); 
        payload.append('status_ayah', document.getElementById('status_ayah') ? document.getElementById('status_ayah').value : ""); 
        payload.append('nama_ibu', document.getElementById('nama_ibu') ? document.getElementById('nama_ibu').value : ""); 
        payload.append('pekerjaan_ibu', document.getElementById('pekerjaan_ibu') ? document.getElementById('pekerjaan_ibu').value : ""); 
        payload.append('status_ibu', document.getElementById('status_ibu') ? document.getElementById('status_ibu').value : ""); 
        payload.append('asal_sekolah', document.getElementById('asal_sekolah') ? document.getElementById('asal_sekolah').value : ""); 
        payload.append('status_bantuan', document.getElementById('status_bantuan') ? document.getElementById('status_bantuan').value : ""); 
        payload.append('entitas_pembawa', entitasTerpilih.join(", "));
        
        ['atas_osis', 'bawah_osis', 'atas_or', 'bawah_or'].forEach(u => { let val = document.getElementById(`ukur_${u}`) ? document.getElementById(`ukur_${u}`).value : "-"; payload.append(`ukuran_${u}`, val); }); 
        ['formulir', 'skl', 'nilai', 'tka', 'foto', 'ijazah', 'kk', 'akte', 'bantuan'].forEach(b => { let val = document.getElementById(`berkas_${b}`) ? document.getElementById(`berkas_${b}`).value : "Belum Ada"; payload.append(`berkas_${b}`, val); });
        
        try {
            const response = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const result = await response.json();
            if(result.status === 'success') {
                if(typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: editModeId ? 'Berhasil Diperbarui!' : 'Berhasil Disimpan!',
                        html: `ID Pendaftaran: <b>${editModeId ? editModeId : result.data.id_pendaftaran}</b>`,
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonColor: '#2563eb',
                        cancelButtonColor: '#64748b',
                        confirmButtonText: editModeId ? 'Tutup Form' : 'Input Baru',
                        cancelButtonText: 'Ke Tabel Data'
                    }).then((resSwal) => {
                        let tempEditId = editModeId;
                        editModeId = null; muridForm.reset(); 
                        if (resSwal.isConfirmed) { if(tempEditId) { window.switchView('tabel'); } else { window.bukaFormBaru(); } } else { window.switchView('tabel'); }
                    });
                }
                loadMasterData(false);
            } else { if(typeof Swal !== 'undefined') Swal.fire('Gagal', result.message, 'error'); }
        } catch (err) { if(typeof Swal !== 'undefined') Swal.fire('Error', 'Koneksi terputus: ' + err.message, 'error'); } finally { if(btnSubmit) btnSubmit.disabled = false; }
    });
}

window.editData = function(id) {
    const data = masterData.find(m => m.id_pendaftaran === id); 
    if(!data) { if(typeof Swal !== 'undefined') Swal.fire('Error', 'Data tidak ditemukan.', 'error'); return; }
    
    editModeId = id; 
    const fTitle = document.getElementById('formTitle'); if(fTitle) fTitle.innerHTML = `<i class="ph-fill ph-pencil-simple text-amber-500"></i> Edit Data: ${id}`; 
    const btnSub = document.getElementById('btnSubmitMurid'); if(btnSub) btnSub.innerHTML = `<i class="ph ph-check-circle text-xl"></i> Update Data Pendaftar`;
    
    let dusun = "", rt = "", rw = ""; 
    try { let addr = data.alamat_lengkap || ""; if(addr.includes("Dusun ") && addr.includes("RT ")) { dusun = addr.split("Dusun ")[1].split(", RT ")[0]; rt = addr.split(", RT ")[1].split("/RW ")[0]; rw = addr.split("/RW ")[1]; } } catch(e) {}
    
    if(document.getElementById('nama_lengkap')) document.getElementById('nama_lengkap').value = data.nama_lengkap || ""; 
    if(document.getElementById('jenis_kelamin')) document.getElementById('jenis_kelamin').value = data.jenis_kelamin || ""; 
    if(document.getElementById('nisn')) document.getElementById('nisn').value = data.nisn || ""; 
    if(document.getElementById('nik')) document.getElementById('nik').value = data.nik || ""; 
    if(document.getElementById('tempat_lahir')) document.getElementById('tempat_lahir').value = data.tempat_lahir || ""; 
    if(data.tanggal_lahir && document.getElementById('tanggal_lahir')) { try { document.getElementById('tanggal_lahir').value = new Date(data.tanggal_lahir).toISOString().split('T')[0]; } catch(e){} }
    if(document.getElementById('agama')) document.getElementById('agama').value = data.agama || "Islam"; 
    if(document.getElementById('no_hp_murid')) document.getElementById('no_hp_murid').value = data.no_hp_murid || ""; 
    if(document.getElementById('alamat_dusun')) document.getElementById('alamat_dusun').value = dusun; 
    if(document.getElementById('alamat_rt')) document.getElementById('alamat_rt').value = rt; 
    if(document.getElementById('alamat_rw')) document.getElementById('alamat_rw').value = rw; 
    
    window.setSelect2Value('desa_kelurahan', data.desa_kelurahan); window.setSelect2Value('kecamatan', data.kecamatan);
    if(data.jenis_tinggal && document.getElementById('jenis_tinggal')) { document.getElementById('jenis_tinggal').value = data.jenis_tinggal; window.toggleWali(data.jenis_tinggal); }
    
    if(document.getElementById('nama_wali')) document.getElementById('nama_wali').value = data.nama_wali || ""; 
    if(document.getElementById('hp_wali')) document.getElementById('hp_wali').value = data.hp_wali || ""; 
    if(document.getElementById('alamat_wali')) document.getElementById('alamat_wali').value = data.alamat_wali || ""; 
    if(document.getElementById('no_hp_ortu')) document.getElementById('no_hp_ortu').value = data.no_hp_ortu || ""; 
    if(document.getElementById('nama_ayah')) document.getElementById('nama_ayah').value = data.nama_ayah || ""; 
    
    window.setSelect2Value('pekerjaan_ayah', data.pekerjaan_ayah); 
    if(document.getElementById('status_ayah')) document.getElementById('status_ayah').value = data.status_ayah || "Masih Hidup"; 
    if(document.getElementById('nama_ibu')) document.getElementById('nama_ibu').value = data.nama_ibu || ""; 
    
    window.setSelect2Value('pekerjaan_ibu', data.pekerjaan_ibu); 
    if(document.getElementById('status_ibu')) document.getElementById('status_ibu').value = data.status_ibu || "Masih Hidup"; 
    
    window.setSelect2Value('asal_sekolah', data.asal_sekolah);
    if(document.getElementById('status_bantuan')) document.getElementById('status_bantuan').value = data.status_bantuan || "Tidak Ada"; 
    
    const arrEntitas = (data.entitas_pembawa || "").split(", "); document.querySelectorAll('input[name="chk_entitas"]').forEach(chk => { chk.checked = arrEntitas.includes(chk.value); });
    ['atas_osis', 'bawah_osis', 'atas_or', 'bawah_or'].forEach(u => { let el = document.getElementById(`ukur_${u}`); if(el) el.value = data[`ukuran_${u}`] || '-'; }); 
    ['formulir', 'skl', 'nilai', 'tka', 'foto', 'ijazah', 'kk', 'akte', 'bantuan'].forEach(b => { let el = document.getElementById(`berkas_${b}`); if(el) el.value = data[`berkas_${b}`] || 'Belum Ada'; });
    
    window.switchView('form'); if (typeof $ !== 'undefined') $('select').trigger('change');
};

// ========================================================
// PROFIL PENGGUNA
// ========================================================
const btnOpenProfile = document.getElementById('btnOpenProfile');
if(btnOpenProfile){
    btnOpenProfile.addEventListener('click', () => {
        const userStr = sessionStorage.getItem('spmb_session'); if(!userStr) return; const user = JSON.parse(userStr);
        if(document.getElementById('profNama')) document.getElementById('profNama').innerText = user.nama_lengkap || "-";
        if(document.getElementById('profRole')) document.getElementById('profRole').innerText = user.role || "-";
        if(document.getElementById('prof_foto_url')) document.getElementById('prof_foto_url').value = user.foto_profil || "";
        if(document.getElementById('prof_new_pass')) document.getElementById('prof_new_pass').value = "";
        let profImg = document.getElementById('previewFotoProfil');
        if(profImg) profImg.src = user.foto_profil || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.nama_lengkap) + '&background=random';
        if(document.getElementById('modalProfile')) document.getElementById('modalProfile').classList.remove('spa-hidden');
    });
}

const formProfile = document.getElementById('formProfile');
if(formProfile){
    formProfile.addEventListener('submit', async (e) => {
        e.preventDefault(); const btn = document.getElementById('btnUpdateProfile'); if(btn) { btn.disabled = true; btn.innerText = "Menyimpan..."; }
        const newPass = document.getElementById('prof_new_pass') ? document.getElementById('prof_new_pass').value : "";
        const fotoUrl = document.getElementById('prof_foto_url') ? document.getElementById('prof_foto_url').value : "";
        if(typeof Swal !== 'undefined') { Swal.fire({ title: 'Memperbarui Profil...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } }); }
        const userStr = sessionStorage.getItem('spmb_session'); if(!userStr) return; const user = JSON.parse(userStr);
        const payload = new URLSearchParams(); payload.append('action', 'update_profile'); payload.append('username', user.username); payload.append('new_password', newPass); payload.append('foto_profil', fotoUrl);
        try {
            const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const r = await res.json();
            if(r.status === 'success') {
                sessionStorage.setItem('spmb_session', JSON.stringify(r.data)); window.tampilkanApp(r.data);
                if(document.getElementById('modalProfile')) document.getElementById('modalProfile').classList.add('spa-hidden');
                if(typeof Swal !== 'undefined') Swal.fire('Berhasil!', 'Profil Anda telah diperbarui.', 'success');
            } else { if(typeof Swal !== 'undefined') Swal.fire('Gagal', r.message, 'error'); }
        } catch(err) { if(typeof Swal !== 'undefined') Swal.fire('Error', 'Gagal menghubungi server.', 'error'); } finally { if(btn) { btn.disabled = false; btn.innerText = "Simpan Profil"; } }
    });
}

// ========================================================
// CORE: GLOBAL LOGIN & SETUP APP
// ========================================================
window.applySettings = function(settings) {
    if(settings.app_name) { 
        if(document.getElementById('loginAppName')) document.getElementById('loginAppName').innerText = settings.app_name; 
        if(document.getElementById('sidebarAppName')) document.getElementById('sidebarAppName').innerText = settings.app_name; 
        if(document.getElementById('appDocumentTitle')) document.getElementById('appDocumentTitle').innerText = settings.app_name; 
    }
    if(settings.logo_url) {
        const lgLogin = document.getElementById('loginLogoImage'); const lgSidebar = document.getElementById('sidebarLogoImage');
        if(lgLogin) { lgLogin.src = settings.logo_url; lgLogin.classList.remove('hidden'); }
        if(document.getElementById('loginLogoIcon')) document.getElementById('loginLogoIcon').classList.add('hidden');
        if(lgSidebar) { lgSidebar.src = settings.logo_url; lgSidebar.classList.remove('hidden'); }
        if(document.getElementById('sidebarLogoIcon')) document.getElementById('sidebarLogoIcon').classList.add('hidden');
    }
    if(settings.favicon_url) { if(document.getElementById('appFavicon')) document.getElementById('appFavicon').href = settings.favicon_url; }
    
    if(document.getElementById('set_app_name')) document.getElementById('set_app_name').value = settings.app_name || "";
    if(document.getElementById('set_app_desc')) document.getElementById('set_app_desc').value = settings.app_desc || "";
    if(document.getElementById('set_logo_url')) document.getElementById('set_logo_url').value = settings.logo_url || "";
    if(document.getElementById('set_favicon_url')) document.getElementById('set_favicon_url').value = settings.favicon_url || "";
    if(document.getElementById('set_sekolah_nama')) document.getElementById('set_sekolah_nama').value = settings.sekolah_nama || "";
    if(document.getElementById('set_sekolah_akreditasi')) document.getElementById('set_sekolah_akreditasi').value = settings.sekolah_akreditasi || "";
    if(document.getElementById('set_sekolah_alamat')) document.getElementById('set_sekolah_alamat').value = settings.sekolah_alamat || "";
    if(document.getElementById('set_sekolah_email')) document.getElementById('set_sekolah_email').value = settings.sekolah_email || "";
    if(document.getElementById('set_sekolah_website')) document.getElementById('set_sekolah_website').value = settings.sekolah_website || "";
};

document.addEventListener('DOMContentLoaded', async () => { 
    window.initSelect2Global();
    if (typeof $ !== 'undefined') { document.addEventListener('reset', function(e) { setTimeout(() => { $(e.target).find('select').trigger('change'); }, 10); }); }
    try { const s = await fetch(SCRIPT_URL.trim() + "?action=get_settings"); const textRes = await s.text(); const sRes = JSON.parse(textRes); if(sRes.status === 'success') window.applySettings(sRes.data); } catch(e){}
    const saved = sessionStorage.getItem('spmb_session'); if(saved) { window.tampilkanApp(JSON.parse(saved)); window.startAutoSync(); }
    const chkContainer = document.getElementById('checklistAtributContainer');
    if(chkContainer) { listAtributLogistik.forEach(attr => { chkContainer.innerHTML += `<label class="flex items-center space-x-2 text-sm bg-slate-50 p-2 rounded border cursor-pointer hover:bg-slate-100"><input type="checkbox" name="chk_logistik_attr" value="${attr}" class="rounded text-blue-600 focus:ring-blue-500"><span>${attr}</span></label>`; }); }
});

const loginForm = document.getElementById('loginForm');
if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const uIn = document.getElementById('username') ? document.getElementById('username').value.trim() : "";
        const pIn = document.getElementById('password') ? document.getElementById('password').value.trim() : "";
        if(!uIn || !pIn) { if(typeof Swal !== 'undefined') Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Username dan Password wajib diisi!' }); return; }
        if(typeof Swal !== 'undefined') Swal.fire({ title: 'Menghubungkan...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
        try {
            const fd = new URLSearchParams(); fd.append('action', 'login'); fd.append('username', uIn); fd.append('password', pIn);
            const response = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: fd }); const textRes = await response.text(); 
            let result; try { result = JSON.parse(textRes); } catch(e) { throw new Error("Akses diblokir oleh sistem atau URL salah."); }
            if (result.status === 'success') { 
                sessionStorage.setItem('spmb_session', JSON.stringify(result.data)); sessionStorage.setItem('lastActiveTime', Date.now()); 
                if(typeof Swal !== 'undefined') Swal.close(); window.tampilkanApp(result.data); window.startAutoSync(); 
            } else { if(typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Login Gagal', text: result.message }); } 
        } catch (err) { if(typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Koneksi Bermasalah', text: err.message }); }
    });
}

const btnLogout = document.getElementById('btnLogout');
if(btnLogout) {
    btnLogout.addEventListener('click', () => { sessionStorage.removeItem('spmb_session'); sessionStorage.removeItem('lastActiveTime'); if(window.syncInterval) clearInterval(window.syncInterval); location.reload(); });
}

window.tampilkanApp = async function(userData) {
    const loginView = document.getElementById('loginView'); if(loginView) loginView.classList.add('spa-hidden'); 
    const appView = document.getElementById('appView'); if(appView) appView.classList.remove('spa-hidden');
    const uNameDisplay = document.getElementById('userNameDisplay'); if(uNameDisplay) uNameDisplay.innerText = userData.nama_lengkap; 
    const uRoleBadge = document.getElementById('userRoleBadge'); if(uRoleBadge) uRoleBadge.innerText = userData.role;
    
    let profIcon = document.getElementById('sidebarAvatarIcon'); let profImg = document.getElementById('sidebarAvatar');
    if(userData.foto_profil && userData.foto_profil.trim() !== "") {
        if(profIcon) profIcon.classList.add('hidden'); if(profImg) { profImg.src = userData.foto_profil; profImg.classList.remove('hidden'); }
    } else { if(profIcon) profIcon.classList.remove('hidden'); if(profImg) profImg.classList.add('hidden'); }

    currentUserTeam = userData.tim_visitor || ""; currentUserRole = userData.role || ""; let roleStr = currentUserRole.trim().toLowerCase(); 
    
    const allNavs = ['navDashboard','navTabel','navKelolaVisit','navStokLogistik','navLogistik','navVisitGuru','navHasilVisit','navRiwayatVisit','navSettings'];
    const allLabels = ['labelMenuUtama', 'labelMenuLogistik', 'labelMenuVisit', 'labelMenuAdmin'];
    allNavs.forEach(n => { const el = document.getElementById(n); if(el) el.classList.add('hidden'); });
    allLabels.forEach(l => { const el = document.getElementById(l); if(el) el.classList.add('hidden'); });

    if(document.getElementById('navDashboard')) document.getElementById('navDashboard').classList.remove('hidden');
    if(document.getElementById('labelMenuUtama')) document.getElementById('labelMenuUtama').classList.remove('hidden');

    ['panelPendaftar', 'panelSDDesa', 'berkasPanel', 'logistikPanel', 'visitStatsPanel', 'adminUsersStatsPanel'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.add('hidden'); });
    ['panelPendaftar', 'panelSDDesa'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.remove('hidden'); });

    if (roleStr === "administrator") {
        ['navTabel', 'navKelolaVisit', 'navStokLogistik', 'navLogistik', 'navSettings'].forEach(n => { const el = document.getElementById(n); if(el) el.classList.remove('hidden'); });
        allLabels.forEach(l => { const el = document.getElementById(l); if(el) el.classList.remove('hidden'); });
        const btnTambah = document.getElementById('btnTambahPendaftarUtama'); if(btnTambah) btnTambah.classList.remove('hidden'); 
        ['adminUsersStatsPanel', 'berkasPanel', 'logistikPanel', 'visitStatsPanel'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.remove('hidden'); });
        window.loadUsersData(); 
    } 
    else if (roleStr === "kepala sekolah" || roleStr === "ketua panitia") {
        ['navTabel', 'navStokLogistik', 'navLogistik'].forEach(n => { const el = document.getElementById(n); if(el) el.classList.remove('hidden'); });
        if(document.getElementById('labelMenuLogistik')) document.getElementById('labelMenuLogistik').classList.remove('hidden');
        ['berkasPanel', 'logistikPanel'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.remove('hidden'); });
        const btnTambah = document.getElementById('btnTambahPendaftarUtama'); if(btnTambah) btnTambah.classList.add('hidden'); 
    } 
    else if (roleStr === "admin input") {
        if(document.getElementById('navTabel')) document.getElementById('navTabel').classList.remove('hidden'); if(document.getElementById('navKelolaVisit')) document.getElementById('navKelolaVisit').classList.remove('hidden'); if(document.getElementById('btnTambahPendaftarUtama')) document.getElementById('btnTambahPendaftarUtama').classList.remove('hidden'); if(document.getElementById('berkasPanel')) document.getElementById('berkasPanel').classList.remove('hidden');
    } 
    else if (roleStr === "petugas seragam" || roleStr === "logistik") {
        if(document.getElementById('navTabel')) document.getElementById('navTabel').classList.remove('hidden'); if(document.getElementById('navStokLogistik')) document.getElementById('navStokLogistik').classList.remove('hidden'); if(document.getElementById('navLogistik')) document.getElementById('navLogistik').classList.remove('hidden'); if(document.getElementById('labelMenuLogistik')) document.getElementById('labelMenuLogistik').classList.remove('hidden'); if(document.getElementById('logistikPanel')) document.getElementById('logistikPanel').classList.remove('hidden'); if(document.getElementById('btnTambahPendaftarUtama')) document.getElementById('btnTambahPendaftarUtama').classList.add('hidden');
    } 
    else if (roleStr === "guru") {
        if(document.getElementById('navTabel')) document.getElementById('navTabel').classList.remove('hidden'); if(document.getElementById('btnTambahPendaftarUtama')) document.getElementById('btnTambahPendaftarUtama').classList.add('hidden');
    }

    if (currentUserTeam.trim() !== "" || roleStr === "administrator" || roleStr === "kepala sekolah" || roleStr === "ketua panitia") {
        if(document.getElementById('navVisitGuru')) document.getElementById('navVisitGuru').classList.remove('hidden');
        if(document.getElementById('navHasilVisit')) document.getElementById('navHasilVisit').classList.remove('hidden');
        if(document.getElementById('navRiwayatVisit')) document.getElementById('navRiwayatVisit').classList.remove('hidden');
        if(document.getElementById('labelMenuVisit')) document.getElementById('labelMenuVisit').classList.remove('hidden');
        window.loadVisitData(false);
    }
    
    window.switchView('dashboard'); 
    window.fetchReferences(); 
    
    await window.loadStokData();
    await window.loadMasterData(false);
};

const formSettings = document.getElementById('formSettings');
if(formSettings) {
    formSettings.addEventListener('submit', async(e) => {
        e.preventDefault(); 
        if(typeof Swal !== 'undefined') Swal.fire({ title: 'Menyimpan Pengaturan...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
        
        const payload = new URLSearchParams(); payload.append('action', 'save_settings'); payload.append('app_name', document.getElementById('set_app_name') ? document.getElementById('set_app_name').value : ""); payload.append('app_desc', document.getElementById('set_app_desc') ? document.getElementById('set_app_desc').value : ""); payload.append('logo_url', document.getElementById('set_logo_url') ? document.getElementById('set_logo_url').value : ""); payload.append('favicon_url', document.getElementById('set_favicon_url') ? document.getElementById('set_favicon_url').value : ""); payload.append('sekolah_nama', document.getElementById('set_sekolah_nama') ? document.getElementById('set_sekolah_nama').value : ""); payload.append('sekolah_akreditasi', document.getElementById('set_sekolah_akreditasi') ? document.getElementById('set_sekolah_akreditasi').value : ""); payload.append('sekolah_alamat', document.getElementById('set_sekolah_alamat') ? document.getElementById('set_sekolah_alamat').value : ""); payload.append('sekolah_email', document.getElementById('set_sekolah_email') ? document.getElementById('set_sekolah_email').value : ""); payload.append('sekolah_website', document.getElementById('set_sekolah_website') ? document.getElementById('set_sekolah_website').value : "");
        try {
            const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); const r = await res.json();
            if(r.status === 'success') { 
                if(typeof Swal !== 'undefined') Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Pengaturan tersimpan!' });
                window.applySettings({ app_name: document.getElementById('set_app_name') ? document.getElementById('set_app_name').value : "", app_desc: document.getElementById('set_app_desc') ? document.getElementById('set_app_desc').value : "", logo_url: document.getElementById('set_logo_url') ? document.getElementById('set_logo_url').value : "", favicon_url: document.getElementById('set_favicon_url') ? document.getElementById('set_favicon_url').value : "", sekolah_nama: document.getElementById('set_sekolah_nama') ? document.getElementById('set_sekolah_nama').value : "", sekolah_akreditasi: document.getElementById('set_sekolah_akreditasi') ? document.getElementById('set_sekolah_akreditasi').value : "", sekolah_alamat: document.getElementById('set_sekolah_alamat') ? document.getElementById('set_sekolah_alamat').value : "", sekolah_email: document.getElementById('set_sekolah_email') ? document.getElementById('set_sekolah_email').value : "", sekolah_website: document.getElementById('set_sekolah_website') ? document.getElementById('set_sekolah_website').value : "" }); 
            } else { if(typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Gagal', text: r.message }); }
        } catch(err) { if(typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal terhubung ke Server' }); }
    });
}

window.startAutoSync = function() {
    if(window.syncInterval) clearInterval(window.syncInterval);
    window.syncInterval = setInterval(async () => { 
        if(sessionStorage.getItem('spmb_session')) { 
            await window.loadStokData();
            await window.loadMasterData(true); 
            window.loadVisitData(true); 
        } 
    }, 10000); 
};

// ========================================================
// FUNGSI TARIK DATA & RENDER TABEL UTAMA
// ========================================================
window.fetchReferences = async function() {
    try {
        const response = await fetch(SCRIPT_URL.trim() + "?action=get_references"); const textRes = await response.text(); const result = JSON.parse(textRes);
        if(result.status === "success") {
            const populate = (id, data) => { const el = document.getElementById(id); if(el) { el.innerHTML = '<option value="">-- Pilih --</option>'; data.forEach(i => el.innerHTML += `<option value="${i}">${i}</option>`); } };
            populate('desa_kelurahan', result.data.desa); populate('v_desa', result.data.desa); populate('asal_sekolah', result.data.sekolah); populate('v_sd', result.data.sekolah); populate('v_tim', result.data.tim); populate('kecamatan', result.data.kecamatan); populate('v_kecamatan', result.data.kecamatan); populate('pekerjaan_ayah', result.data.pekerjaan); populate('pekerjaan_ibu', result.data.pekerjaan);
            
            const elCheck = document.getElementById('entitas_checkbox_container'); 
            if(elCheck) { 
                elCheck.innerHTML = ''; const combinedEntitas = [...(result.data.entitas || []), ...(result.data.individu || [])];
                combinedEntitas.forEach(item => { elCheck.innerHTML += `<label class="flex items-center space-x-2 text-sm bg-slate-50 p-2 rounded border cursor-pointer hover:bg-slate-100 transition-colors"><input type="checkbox" name="chk_entitas" value="${item}" class="rounded text-blue-600 focus:ring-blue-500"><span>${item}</span></label>`; }); 
            }
            const optGrp = document.getElementById('optgroupIndividu'); if(optGrp) { optGrp.innerHTML = ''; if (result.data.individu) { result.data.individu.forEach(i => { optGrp.innerHTML += `<option value="${i}">${i}</option>`; }); } }
            if(result.data.kompetitor && result.data.kompetitor.length > 0) { ['pil_1', 'pil_2', 'pil_3'].forEach(id => { const el = document.getElementById(id); if(el) { el.innerHTML = '<option value="">-- Pilih --</option>'; result.data.kompetitor.forEach(s => el.innerHTML += `<option value="${s}">${s}</option>`); } }); }
            if (typeof $ !== 'undefined') $('select').trigger('change');
        }
    } catch (error) { console.error("Error Fetch Reference", error); }
};

window.loadMasterData = async function(isBackground = false) {
    try {
        const response = await fetch(SCRIPT_URL.trim() + "?action=get_master_data"); const result = await response.json();
        if (result.status === "success") { 
            masterData = result.data; 
            try { window.prosesDashboard(masterData); } catch(e){} 
            try { window.renderDashboardStokCards(); } catch(e){} 
            try { window.renderStokLogistik(); } catch(e){} 
            
            let searchInp = document.getElementById('searchInput'); let qUtama = searchInp ? searchInp.value.trim() : "";
            if (qUtama === "") { try { window.renderTabel(masterData); } catch(e){} }

            let logInp = document.getElementById('searchLogistik'); let qLog = logInp ? logInp.value.trim() : "";
            if (qLog === "") { try { window.renderLogistik(masterData); } catch(e){} }
        }
    } catch (error) {}
};

window.loadStokData = async function() {
    try { 
        const response = await fetch(SCRIPT_URL.trim() + "?action=get_stok"); const result = await response.json(); 
        if (result.status === "success") { 
            stockData = result.data; 
            window.renderStokLogistik();
            window.renderDashboardStokCards();
        } 
    } catch (error) {}
};

window.loadVisitData = async function(isBackground = false) {
    let roleFetch = currentUserRole.trim().toLowerCase(); if(!currentUserTeam && roleFetch !== 'administrator' && roleFetch !== 'kepala sekolah' && roleFetch !== 'ketua panitia') return;
    try {
        const response = await fetch(SCRIPT_URL.trim() + "?action=get_visit_data&tim=" + encodeURIComponent(currentUserTeam) + "&role=" + encodeURIComponent(currentUserRole)); const result = await response.json();
        if (result.status === "success") { 
            visitData = result.data; 
            let sVis = document.getElementById('searchVisit'); let qV = sVis ? sVis.value.trim() : "";
            let sRiw = document.getElementById('searchRiwayatVisit'); let qR = sRiw ? sRiw.value.trim() : "";
            let sHas = document.getElementById('searchHasilVisit'); let qH = sHas ? sHas.value.trim() : "";
            if (qV === "" && qR === "" && qH === "") { try { window.renderVisitAndRiwayat(visitData); } catch(e){} }
        }
    } catch (error) {}
};

window.viewData = function(id) {
    const d = masterData.find(m => m.id_pendaftaran === id); if(!d) return; 
    const content = document.getElementById('viewModalContent'); if(!content) return;
    const renderField = (label, val) => `<div><p class="text-slate-500 text-[10px] uppercase font-bold tracking-wider">${label}</p><p class="font-medium text-slate-800 text-sm">${val || '-'}</p></div>`;
    content.innerHTML = `<div class="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"><div><p class="text-sm text-blue-600 font-semibold">ID Pendaftaran</p><p class="text-2xl font-bold text-blue-900">${d.id_pendaftaran}</p></div><div class="text-left md:text-right"><p class="text-sm text-slate-500">Asal Sekolah</p><p class="font-semibold text-slate-800">${d.asal_sekolah || '-'}</p></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-8"><div class="space-y-6"><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-user"></i> Biodata Murid</h4><div class="grid grid-cols-2 gap-3"><div class="col-span-2">${renderField('Nama Lengkap', d.nama_lengkap)}</div>${renderField('Jenis Kelamin', d.jenis_kelamin)} ${renderField('Agama', d.agama)} ${renderField('Tempat Lahir', d.tempat_lahir)} ${renderField('Tanggal Lahir', d.tanggal_lahir ? new Date(d.tanggal_lahir).toLocaleDateString('id-ID') : '-')} ${renderField('NIK', d.nik)} ${renderField('NISN', d.nisn)} ${renderField('No HP Murid', d.no_hp_murid)}</div></div><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-house"></i> Domisili &amp; Wali</h4><div class="space-y-3">${renderField('Alamat Lengkap', d.alamat_lengkap)}<div class="grid grid-cols-2 gap-3">${renderField('Desa/Kelurahan', d.desa_kelurahan)} ${renderField('Kecamatan', d.kecamatan)}</div><div class="bg-slate-50 p-3 rounded mt-2">${renderField('Tempat Tinggal Saat Saat', d.jenis_tinggal)} ${d.jenis_tinggal === 'Bersama Wali/Kerabat' ? `<div class="mt-2 grid grid-cols-2 gap-2 border-t pt-2">${renderField('Nama Wali', d.nama_wali)}${renderField('HP Wali', d.hp_wali)}${renderField('Alamat Wali', d.alamat_wali)}</div>` : ''}</div></div></div></div><div class="space-y-6"><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-users"></i> Data Orang Tua</h4><div class="mb-3 p-2 bg-yellow-50 rounded border border-yellow-200">${renderField('No. HP Utama (Kontak Darurat)', d.no_hp_ortu)}</div><div class="grid grid-cols-2 gap-4"><div><p class="text-xs font-bold text-slate-700 mb-1 border-b pb-1">Data Ayah</p>${renderField('Nama', d.nama_ayah)} ${renderField('Pekerjaan', d.pekerjaan_ayah)} ${renderField('Status', d.status_ayah)}</div><div><p class="text-xs font-bold text-slate-700 mb-1 border-b pb-1">Data Ibu</p>${renderField('Nama', d.nama_ibu)} ${renderField('Pekerjaan', d.pekerjaan_ibu)} ${renderField('Status', d.status_ibu)}</div></div></div><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-t-shirt"></i> Seragam &amp; Akademik</h4><div class="grid grid-cols-2 gap-3 mb-3">${renderField('Status Bantuan', d.status_bantuan)}<div class="col-span-2">${renderField('Entitas Pembawa', d.entitas_pembawa)}</div></div><div class="grid grid-cols-4 gap-2 border-t pt-3">${renderField('Atas OSIS', d.ukuran_atas_osis)} ${renderField('Bawah OSIS', d.ukuran_bawah_osis)} ${renderField('Atas OR', d.ukuran_atas_or)} ${renderField('Bawah OR', d.ukuran_bawah_or)}</div><div class="col-span-4 mt-2 bg-slate-50 p-2 text-xs border rounded">${renderField('Checklist Atribut Tambahan', (d.atribut_lengkap || "").replace(/,/g, ', '))}</div></div></div></div><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm mt-6"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-folders text-amber-500"></i> Kelengkapan Dokumen Fisik</h4><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">${[ {key:'formulir', label:'Formulir'}, {key:'skl', label:'SKL'}, {key:'nilai', label:'Nilai'}, {key:'tka', label:'Hasil TKA'}, {key:'foto', label:'Foto 3x4'}, {key:'ijazah', label:'Ijazah'}, {key:'kk', label:'K. Keluarga'}, {key:'akte', label:'Akte'}, {key:'bantuan', label:'Bantuan'} ].map(k => { const val = d[`berkas_${k.key}`]; return `<div class="flex flex-col p-2 rounded ${val === 'Belum Ada' ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}"><span class="font-semibold text-xs text-slate-600 mb-1">${k.label}</span> <span class="${val === 'Belum Ada' ? 'text-red-600 font-bold text-xs' : 'text-green-600 font-semibold text-xs'}">${val}</span></div>`; }).join('')}</div></div>`;
    let modView = document.getElementById('viewModal'); if(modView) modView.classList.remove('spa-hidden');
};

window.deleteData = async function(id) {
    if(typeof Swal === 'undefined') return;
    const result = await Swal.fire({ title: 'Hapus Permanen?', text: `Anda yakin ingin menghapus data ${id} secara permanen?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b', confirmButtonText: 'Ya, Hapus!' });
    if (!result.isConfirmed) return;
    
    Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
    try {
        const payload = new URLSearchParams(); payload.append('action', 'delete_murid'); payload.append('id_pendaftaran', id);
        const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const r = await res.json();
        if(r.status === 'success') { Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success'); window.loadMasterData(false); } 
        else { Swal.fire('Gagal', r.message, 'error'); }
    } catch(e) { Swal.fire('Error', 'Koneksi terputus', 'error'); }
};

window.bukaLaporVisit = function(id) {
    const d = visitData.find(v => v.id_visit === id);
    if(!d) {
        if(typeof Swal !== 'undefined') Swal.fire('Error', 'Data visit tidak ditemukan di memori.', 'error');
        return;
    }
    selectedVisitId = id; 
    let lblNama = document.getElementById('visitNamaLabel'); if(lblNama) lblNama.innerText = d.nama_lengkap; 
    let frmLapor = document.getElementById('formLaporVisit'); if(frmLapor) { frmLapor.dataset.tim = d.tim_alokasi; frmLapor.reset(); }
    window.toggleSekolahLain(""); 
    let modLapor = document.getElementById('laporVisitModal'); if(modLapor) modLapor.classList.remove('spa-hidden');
    window.initSelect2Global();
};

window.toggleSekolahLain = function(val) { 
    const area = document.getElementById('areaSekolahLain'); if(!area) return;
    if(val === "Sekolah Lain") area.classList.remove('hidden'); else area.classList.add('hidden'); 
    if (typeof $ !== 'undefined') $('select').trigger('change');
};

const formLaporVisit = document.getElementById('formLaporVisit');
if(formLaporVisit) {
    formLaporVisit.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        if(typeof Swal !== 'undefined') Swal.fire({ title: 'Mengirim Laporan...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
        
        const user = JSON.parse(sessionStorage.getItem('spmb_session')); const timAnak = formLaporVisit.dataset.tim;

        const payload = new URLSearchParams(); 
        payload.append('action', 'submit_laporan_visit'); 
        payload.append('id_visit', selectedVisitId); 
        payload.append('petugas', user.nama_lengkap + " (" + user.role + ")"); 
        payload.append('tim_asal', timAnak); 
        
        let hasilVal = document.getElementById('hasil_visit') ? document.getElementById('hasil_visit').value : "";
        let ketVal = document.getElementById('keterangan_visit') ? document.getElementById('keterangan_visit').value : "";
        payload.append('hasil', hasilVal); payload.append('keterangan', ketVal);
        
        if(hasilVal === "Sekolah Lain") { 
            payload.append('pilihan_1', document.getElementById('pil_1') ? document.getElementById('pil_1').value : ""); 
            payload.append('pilihan_2', document.getElementById('pil_2') ? document.getElementById('pil_2').value : ""); 
            payload.append('pilihan_3', document.getElementById('pil_3') ? document.getElementById('pil_3').value : ""); 
        }

        try {
            const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const r = await res.json();
            if(r.status === 'success') { 
                if(typeof Swal !== 'undefined') Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Laporan berhasil dikirim!' });
                let mLap = document.getElementById('laporVisitModal');
                if(mLap) mLap.classList.add('spa-hidden'); 
                window.loadVisitData(false); if(hasilVal === "Langsung Mendaftar") window.loadMasterData(false); 
            } else { if(typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Gagal', text: r.message }); }
        } catch (err) { if(typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Error Jaringan', text: 'Terjadi kesalahan jaringan.' }); }
    });
}

window.renderVisitAndRiwayat = function(data) {
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

        let aksiBtn = `<button type="button" onclick="window.bukaLaporVisit('${m.id_visit}')" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm transition-colors"><i class="ph ph-note-pencil mr-1 align-middle"></i>Lapor</button>`;

        if (m.status_visit === 'Sudah') {
            hasHasil = true;
            if(tbodyHsl) {
                tbodyHsl.innerHTML += `<tr class="hover:bg-slate-50 border-b"><td class="p-3 text-center text-slate-500">${noHsl++}</td><td class="p-3 font-semibold text-slate-800">${m.nama_lengkap}</td><td class="p-3 text-center">${m.lp}</td><td class="p-3 text-slate-600">${m.asal_sekolah}</td><td class="p-3">${m.nama_ayah || '-'}</td><td class="p-3">${m.nama_ibu || '-'}</td><td class="p-3 text-xs max-w-[150px] truncate" title="${m.alamat}">${m.alamat}</td><td class="p-3 text-xs text-blue-600 font-semibold">${m.pilihan_1 || '-'}</td><td class="p-3 text-xs">${m.pilihan_2 || '-'}</td><td class="p-3 text-xs">${m.pilihan_3 || '-'}</td><td class="p-3 text-xs max-w-[150px] truncate" title="${m.keterangan}">${m.keterangan || '-'}</td></tr>`;
            }
        } else if (isExpired) {
            hasRiwayat = true;
            if(tbodyRwt) {
                let statBadge = `<span class="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded border border-red-200"><i class="ph-fill ph-warning-circle"></i> Belum Tervisit</span>`;
                tbodyRwt.innerHTML += `<tr class="hover:bg-slate-50 border-b"><td class="p-3 text-center text-slate-500">${noRwt++}</td><td class="p-3 font-semibold text-slate-800">${m.nama_lengkap}</td><td class="p-3 text-center">${m.lp}</td><td class="p-3 text-slate-600">${m.asal_sekolah}</td><td class="p-3">${m.nama_ayah || '-'}</td><td class="p-3">${m.nama_ibu || '-'}</td><td class="p-3 text-xs max-w-[150px] truncate" title="${m.alamat}">${m.alamat}</td><td class="p-3 text-center">${statBadge}</td><td class="p-3 text-center">${aksiBtn}</td></tr>`;
            }
        } else {
            hasTarget = true;
            if(tbodyTgt) {
                tbodyTgt.innerHTML += `<tr class="hover:bg-slate-50 border-b"><td class="p-3 text-center text-slate-500">${noTgt++}</td><td class="p-3 font-semibold text-slate-800">${m.nama_lengkap}</td><td class="p-3 text-center">${m.lp}</td><td class="p-3 text-slate-600">${m.asal_sekolah}</td><td class="p-3">${m.nama_ayah || '-'}</td><td class="p-3">${m.nama_ibu || '-'}</td><td class="p-3 text-xs max-w-[200px] truncate" title="${m.alamat}">${m.alamat}</td><td class="p-3 text-center">${aksiBtn}</td></tr>`;
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
                let btnHtml = timStats[t].belum > 0 ? `<button onclick="window.showDetailVisitTeam('${t}')" class="w-full mt-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold py-1 rounded transition-colors">Lihat Sisa Target</button>` : `<div class="w-full mt-2 text-center text-xs text-green-600 font-bold py-1"><i class="ph-fill ph-check-circle align-middle"></i> Selesai Semua</div>`;
                vContainer.innerHTML += `<div class="bg-white p-4 border border-slate-200 rounded-xl shadow-sm border-l-4 border-l-purple-500"><h4 class="font-bold text-slate-800 mb-2">${t}</h4><div class="flex justify-between text-sm"><span class="text-slate-500">Selesai:</span> <span class="font-bold text-green-600">${timStats[t].selesai}</span></div><div class="flex justify-between text-sm"><span class="text-slate-500">Sisa Target:</span> <span class="font-bold text-red-500">${timStats[t].belum}</span></div><div class="mt-2 pt-2 border-t text-xs text-slate-400 mb-2">Total Alokasi: ${timStats[t].total} Data</div>${btnHtml}</div>`;
            });
        }
    }
};

window.showDetailVisitTeam = function(teamName) {
    const list = window.tempTimStats[teamName].listBelum; window.tempDataGlobal["visit_" + teamName] = list; window.showDetailTable("Sisa Target Visit: " + teamName, "visit_" + teamName);
};

if(document.getElementById('searchVisit')) { document.getElementById('searchVisit').addEventListener('input', (e) => { const k = e.target.value.toLowerCase(); window.renderVisitAndRiwayat(visitData.filter(m => m.nama_lengkap.toLowerCase().includes(k) || m.asal_sekolah.toLowerCase().includes(k))); }); }
if(document.getElementById('searchRiwayatVisit')) { document.getElementById('searchRiwayatVisit').addEventListener('input', (e) => { const k = e.target.value.toLowerCase(); window.renderVisitAndRiwayat(visitData.filter(m => m.nama_lengkap.toLowerCase().includes(k) || m.asal_sekolah.toLowerCase().includes(k))); }); }
if(document.getElementById('searchHasilVisit')) { document.getElementById('searchHasilVisit').addEventListener('input', (e) => { const k = e.target.value.toLowerCase(); window.renderVisitAndRiwayat(visitData.filter(m => m.nama_lengkap.toLowerCase().includes(k) || m.asal_sekolah.toLowerCase().includes(k))); }); }

window.prosesDashboard = function(data) {
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
        tbodySD.innerHTML = ''; Object.keys(rSD).sort((a,b) => rSD[b].T - rSD[a].T).forEach(k => { tbodySD.innerHTML += `<tr class="clickable-row border-b" onclick="window.doDrillDownUtama('asal_sekolah', '${k.replace(/'/g, "\\'")}')"><td class="p-3">${k}</td><td class="p-3 text-center">${rSD[k].L}</td><td class="p-3 text-center">${rSD[k].P}</td><td class="p-3 text-center font-bold text-blue-600">${rSD[k].T}</td></tr>`; });
    }
    const tbodyDesa = document.getElementById('bodyRekapDesa'); 
    if(tbodyDesa) { 
        tbodyDesa.innerHTML = ''; Object.keys(rDesa).sort((a,b) => rDesa[b].T - rDesa[a].T).forEach(k => { tbodyDesa.innerHTML += `<tr class="clickable-row border-b" onclick="window.doDrillDownUtama('desa_kelurahan', '${k.replace(/'/g, "\\'")}')"><td class="p-3">${k}</td><td class="p-3 text-center">${rDesa[k].L}</td><td class="p-3 text-center">${rDesa[k].P}</td><td class="p-3 text-center font-bold text-emerald-600">${rDesa[k].T}</td></tr>`; });
    }

    const berkasKunci = [{ key: 'berkas_formulir', label: 'Formulir Pendaftaran' }, { key: 'berkas_skl', label: 'Surat Kelulusan (SKL)' }, { key: 'berkas_nilai', label: 'Daftar Nilai' }, { key: 'berkas_tka', label: 'Hasil TKA' }, { key: 'berkas_foto', label: 'Foto 3x4' }, { key: 'berkas_ijazah', label: 'Ijazah Kelulusan' }, { key: 'berkas_kk', label: 'Kartu Keluarga (KK)' }, { key: 'berkas_akte', label: 'Akte Kelahiran' }, { key: 'berkas_bantuan', label: 'Bukti Bantuan' }];
    const containerBerkas = document.getElementById('berkasStatsContainer'); 
    if(containerBerkas) { 
        containerBerkas.innerHTML = '';
        berkasKunci.forEach(b => {
            let jlmBelum = data.filter(m => m[b.key] === "Belum Ada").length; let jlmAda = data.length - jlmBelum;
            const card = document.createElement('div'); card.className = `p-3 bg-white border rounded-xl shadow-sm border-l-4 ${jlmBelum > 0 ? 'border-l-red-500 hover:bg-red-50 cursor-pointer' : 'border-l-green-500'}`;
            card.innerHTML = `<p class="text-xs text-slate-500 font-semibold truncate mb-2">${b.label}</p><div class="flex justify-between items-center"><div><p class="text-[10px] text-slate-400 uppercase">Terkumpul</p><h4 class="text-lg font-bold text-green-600 leading-none">${jlmAda}</h4></div><div class="text-right"><p class="text-[10px] text-slate-400 uppercase">Kurang</p><h4 class="text-lg font-bold ${jlmBelum > 0 ? 'text-red-600' : 'text-slate-400'} leading-none">${jlmBelum}</h4></div></div>`;
            if (jlmBelum > 0) { card.onclick = () => { window.switchView('tabel'); let sInput = document.getElementById('searchInput'); if(sInput) sInput.value = `missing:${b.key}`; window.filterTabel(`missing:${b.key}`); }; } 
            containerBerkas.appendChild(card);
        });
    }
};

window.doDrillDownUtama = function(field, value) { 
    let rCheck = currentUserRole.trim().toLowerCase();
    if(rCheck !== "administrator" && rCheck !== "kepala sekolah" && rCheck !== "ketua panitia" && rCheck !== "admin input") return;
    window.switchView('tabel'); 
    let sInp = document.getElementById('searchInput');
    if(sInp) { sInp.value = `filter:${field}=${value}`; window.filterTabel(`filter:${field}=${value}`); }
};

window.renderDashboardStokCards = function() {
    let tallyKeluar = {}; let tallyKebutuhan = {}; let totalMurid = masterData ? masterData.length : 0; let selesai = 0;
    baseItemsLogistik.forEach(item => { tallyKeluar[item] = 0; tallyKebutuhan[item] = totalMurid; });
    let listBelumDetail = {}; baseItemsLogistik.forEach(item => listBelumDetail[item] = []);

    if(masterData && masterData.length > 0) {
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
    }

    if(document.getElementById('logStatTotal')) { document.getElementById('logStatTotal').innerText = totalMurid; document.getElementById('logStatSelesai').innerText = selesai; document.getElementById('logStatBelum').innerText = totalMurid - selesai; }

    const sizeContainer = document.getElementById('sizeStatsContainer'); const attrContainer = document.getElementById('attrStatsContainer');
    if(sizeContainer) sizeContainer.innerHTML = ''; if(attrContainer) attrContainer.innerHTML = '';

    baseItemsLogistik.forEach((item, index) => {
        let sData = stockData.find(s => s.nama_barang === item) || {stok_awal: 0, barang_masuk: 0};
        let awal = parseInt(sData.stok_awal) || 0; let masuk = parseInt(sData.barang_masuk) || 0;
        let keluar = tallyKeluar[item]; let sisaStok = awal + masuk - keluar;
        let kebutuhanSisa = tallyKebutuhan[item] - keluar; if (kebutuhanSisa < 0) kebutuhanSisa = 0;
        let selisih = sisaStok - kebutuhanSisa;
        let badgeClass = "", statusText = "", icon = "";
        
        if (selisih >= 15) { badgeClass = "bg-green-50 border-green-200 text-green-800"; statusText = "Aman"; icon = "ph-check-circle text-green-500"; } 
        else if (selisih >= 0 && selisih < 15) { badgeClass = "bg-amber-50 border-amber-200 text-amber-800"; statusText = "Segera Restock"; icon = "ph-warning-circle text-amber-500"; } 
        else { badgeClass = "bg-red-50 border-red-200 text-red-800"; statusText = "Habis / Kurang"; icon = "ph-x-circle text-red-500"; }

        let globalKey = 'dashboard_belum_' + index; window.tempDataGlobal[globalKey] = listBelumDetail[item];
        let btnHtml = kebutuhanSisa > 0 ? `<button onclick="window.showDetailTable('Belum Dapat: ${item}', '${globalKey}')" class="w-full mt-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-1.5 rounded transition-colors shadow-sm">Lihat Siswa (${kebutuhanSisa})</button>` : `<div class="w-full mt-3 text-center text-xs text-green-600 font-bold py-1.5"><i class="ph-fill ph-check-circle align-middle"></i> Semua Sudah Dapat</div>`;

        let cardHtml = `<div class="p-4 border rounded-xl shadow-sm ${badgeClass} flex flex-col justify-between"><div><div class="flex justify-between items-start mb-2"><h4 class="font-bold text-sm tracking-tight">${item}</h4><i class="ph-fill ${icon} text-xl"></i></div><div class="grid grid-cols-2 gap-2 mt-3"><div class="bg-white/60 p-2 rounded text-center"><p class="text-[10px] uppercase font-bold opacity-70">Tersedia</p><p class="text-lg font-black">${sisaStok}</p></div><div class="bg-white/60 p-2 rounded text-center"><p class="text-[10px] uppercase font-bold opacity-70">Kebutuhan</p><p class="text-lg font-black">${kebutuhanSisa}</p></div></div><div class="mt-2 text-center text-xs font-bold py-1 bg-white/50 rounded">Status: ${statusText}</div></div>${btnHtml}</div>`;
        if (["Atasan OSIS", "Bawahan OSIS", "Atasan Olahraga", "Bawahan Olahraga"].includes(item)) { if(sizeContainer) sizeContainer.innerHTML += cardHtml; } else { if(attrContainer) attrContainer.innerHTML += cardHtml; }
    });
};

window.renderStokLogistik = function() {
    let tallyKeluar = {}; let tallyKebutuhan = {}; let totalMurid = masterData ? masterData.length : 0;
    baseItemsLogistik.forEach(item => { tallyKeluar[item] = 0; tallyKebutuhan[item] = totalMurid; });

    if(masterData && masterData.length > 0) {
        masterData.forEach(m => {
            if(m.status_osis === 'Sudah') { tallyKeluar['Atasan OSIS']++; tallyKeluar['Bawahan OSIS']++; }
            if(m.status_or === 'Sudah') { tallyKeluar['Atasan Olahraga']++; tallyKeluar['Bawahan Olahraga']++; }
            let attrs = m.atribut_lengkap ? m.atribut_lengkap.split(",") : [];
            attrs.forEach(a => { if(tallyKeluar[a.trim()] !== undefined) tallyKeluar[a.trim()]++; });
        });
    }

    const tbody = document.getElementById('tableStokBody'); if(!tbody) return; tbody.innerHTML = '';
    let rCheck = currentUserRole ? currentUserRole.trim().toLowerCase() : ""; 
    let allowEdit = (rCheck === 'administrator' || rCheck === 'logistik' || rCheck === 'petugas seragam');

    baseItemsLogistik.forEach((item, index) => {
        let sData = stockData.find(s => s.nama_barang === item) || {stok_awal: 0, barang_masuk: 0};
        let awal = parseInt(sData.stok_awal) || 0; let masuk = parseInt(sData.barang_masuk) || 0;
        let keluar = tallyKeluar[item] || 0; let butuh = (tallyKebutuhan[item] || 0) - keluar; if (butuh < 0) butuh = 0;
        let sisa = awal + masuk - keluar; let selisih = sisa - butuh;
        let ket = "Aman", badge = "bg-green-100 text-green-700 border-green-200";
        if (selisih < 0) { ket = "Habis / Kurang"; badge = "bg-red-100 text-red-700 border-red-200"; } else if (selisih >= 0 && selisih < 15) { ket = "Segera Restock"; badge = "bg-amber-100 text-amber-700 border-amber-200"; }

        if(tbody) {
            let btnEdit = allowEdit ? `<button type="button" onclick="window.editStok('${item}', ${awal}, ${masuk})" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded shadow text-xs font-bold transition-colors"><i class="ph ph-pencil-simple"></i> Edit</button>` : `<span class="text-xs text-slate-400 italic">Read-only</span>`;
            let globalKey = 'stok_belum_' + index; 
            let btnLihat = butuh > 0 ? `<button type="button" onclick="window.showDetailTable('Belum Dapat: ${item}', 'dashboard_belum_${index}')" class="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2 py-1 rounded shadow-sm text-xs font-bold transition-colors ml-1 mt-1 xl:mt-0"><i class="ph ph-users"></i> Siapa?</button>` : '';
            tbody.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="p-3 text-center">${index + 1}</td><td class="p-3 font-bold text-slate-800">${item}</td><td class="p-3 text-center text-slate-600">${awal}</td><td class="p-3 text-center text-blue-600 font-bold">+${masuk}</td><td class="p-3 text-center text-amber-600 font-bold">-${keluar}</td><td class="p-3 text-center text-slate-800 font-bold text-lg">${sisa}</td><td class="p-3 text-center text-slate-500">${butuh}</td><td class="p-3 text-center"><span class="px-2 py-1 rounded border text-[10px] uppercase tracking-wider font-bold ${badge}">${ket}</span></td><td class="p-3 text-center whitespace-nowrap">${btnEdit}${btnLihat}</td></tr>`;
        }
    });
};

window.editStok = function(nama, awal, masuk) {
    if(document.getElementById('stok_nama')) document.getElementById('stok_nama').value = nama;
    if(document.getElementById('stok_awal')) document.getElementById('stok_awal').value = awal;
    if(document.getElementById('stok_masuk')) document.getElementById('stok_masuk').value = masuk;
    if(document.getElementById('modalEditStok')) document.getElementById('modalEditStok').classList.remove('spa-hidden');
};

const formEditStokLogic = document.getElementById('formEditStokLogic');
if(formEditStokLogic) {
    formEditStokLogic.addEventListener('submit', async(e) => {
        e.preventDefault(); 
        if(typeof Swal !== 'undefined') Swal.fire({ title: 'Menyimpan Stok...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
        const payload = new URLSearchParams(); payload.append('action', 'save_stok'); payload.append('nama_barang', document.getElementById('stok_nama') ? document.getElementById('stok_nama').value : ""); payload.append('stok_awal', document.getElementById('stok_awal') ? document.getElementById('stok_awal').value : ""); payload.append('barang_masuk', document.getElementById('stok_masuk') ? document.getElementById('stok_masuk').value : ""); 
        try {
            const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); const r = await res.json();
            if(r.status === 'success') { 
                if(typeof Swal !== 'undefined') Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Stok berhasil diupdate!' });
                let modEditStok = document.getElementById('modalEditStok'); if(modEditStok) modEditStok.classList.add('spa-hidden'); 
                window.loadStokData(); 
            } else { if(typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Gagal', text: r.message }); }
        } catch(err) { if(typeof Swal !== 'undefined') Swal.fire({ icon: 'error', title: 'Error Jaringan', text: 'Gagal terhubung ke server.' }); }
    });
}

window.showDetailTable = function(title, globalKey) {
    let modTitle = document.getElementById('detailTableTitle'); if(modTitle) modTitle.innerHTML = `<i class="ph-fill ph-list-magnifying-glass"></i> ${title}`;
    const tbody = document.getElementById('detailTableBody'); if(!tbody) return; tbody.innerHTML = '';
    const dataList = window.tempDataGlobal[globalKey] || [];
    if(dataList.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400">Tidak ada data.</td></tr>'; } else {
        dataList.forEach(item => { tbody.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="p-3 text-slate-600">${item.id}</td><td class="p-3 font-semibold text-slate-800">${item.nama}</td><td class="p-3 text-center">${item.lp}</td><td class="p-3 text-slate-600">${item.desa || '-'}</td><td class="p-3 text-slate-600">${item.sekolah || '-'}</td></tr>`; });
    }
    let modDet = document.getElementById('modalDetailTable'); if(modDet) modDet.classList.remove('spa-hidden');
};

window.renderLogistik = function(data) {
    const tbody = document.getElementById('tableLogistikBody'); if(!tbody) return; tbody.innerHTML = '';
    let rCheck = currentUserRole.trim().toLowerCase(); let allowEdit = (rCheck === 'administrator' || rCheck === 'logistik' || rCheck === 'petugas seragam');
    data.forEach(m => {
        let dAttr = m.atribut_lengkap || ""; let attrComplete = (dAttr.split(",").length >= listAtributLogistik.length); let isLengkap = (m.status_osis === 'Sudah' && m.status_or === 'Sudah' && attrComplete); 
        let badgeColor = isLengkap ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'; let badgeText = isLengkap ? '<i class="ph-fill ph-check-circle align-middle"></i> Selesai' : 'Belum Selesai';
        let btn = allowEdit ? `<button onclick="window.bukaModalLogistik('${m.id_pendaftaran}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded shadow text-xs font-bold transition-colors">Distribusi</button>` : `<button onclick="window.bukaModalLogistik('${m.id_pendaftaran}')" class="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 text-xs font-bold transition-colors shadow-sm"><i class="ph ph-eye text-sm align-middle"></i> View</button>`;
        tbody.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="p-3"><p class="font-bold text-slate-800">${m.nama_lengkap}</p><p class="text-xs text-slate-500">${m.id_pendaftaran}</p></td><td class="p-3 text-xs"><span class="block">Atas: <b>${m.ukuran_atas_osis}</b></span><span class="block">Bawah: <b>${m.ukuran_bawah_osis}</b></span></td><td class="p-3 text-xs"><span class="block">Atas: <b>${m.ukuran_atas_or}</b></span><span class="block">Bawah: <b>${m.ukuran_bawah_or}</b></span></td><td class="p-3 text-center"><span class="px-2 py-1 rounded border text-xs font-bold ${badgeColor}">${badgeText}</span></td><td class="p-3 text-center">${btn}</td></tr>`;
    });
};
let srchLogistik = document.getElementById('searchLogistik');
if(srchLogistik) { srchLogistik.addEventListener('input', (e) => { const k = e.target.value.toLowerCase(); window.renderLogistik(masterData.filter(m => m.nama_lengkap.toLowerCase().includes(k) || m.id_pendaftaran.toLowerCase().includes(k))); }); }

window.bukaModalLogistik = function(id) {
    const d = masterData.find(m => m.id_pendaftaran === id); if(!d) return; logistikId = id;
    if(document.getElementById('logNama')) document.getElementById('logNama').innerText = d.nama_lengkap; 
    if(document.getElementById('logId')) document.getElementById('logId').innerText = d.id_pendaftaran; 
    if(document.getElementById('szAo')) document.getElementById('szAo').innerText = d.ukuran_atas_osis; 
    if(document.getElementById('szBo')) document.getElementById('szBo').innerText = d.ukuran_bawah_osis; 
    if(document.getElementById('szAr')) document.getElementById('szAr').innerText = d.ukuran_atas_or; 
    if(document.getElementById('szBr')) document.getElementById('szBr').innerText = d.ukuran_bawah_or;
    
    window.setSelect2Value('stat_osis', d.status_osis || 'Belum'); window.setSelect2Value('stat_or', d.status_or || 'Belum'); window.setSelect2Value('diserahkan_kepada', d.diserahkan_kepada === "-" ? "" : d.diserahkan_kepada);
    
    let activeAttrs = (d.atribut_lengkap || "").split(","); document.querySelectorAll('input[name="chk_logistik_attr"]').forEach(chk => { chk.checked = activeAttrs.includes(chk.value); });
    let rCheck = currentUserRole.trim().toLowerCase(); let allowEdit = (rCheck === 'administrator' || rCheck === 'logistik' || rCheck === 'petugas seragam');
    
    if(document.getElementById('stat_osis')) document.getElementById('stat_osis').disabled = !allowEdit; 
    if(document.getElementById('stat_or')) document.getElementById('stat_or').disabled = !allowEdit; 
    if(document.getElementById('diserahkan_kepada')) document.getElementById('diserahkan_kepada').disabled = !allowEdit; 
    document.querySelectorAll('input[name="chk_logistik_attr"]').forEach(chk => { chk.disabled = !allowEdit; });
    
    const btnSubmit = document.getElementById('btnSubmitLogistik'); 
    if(btnSubmit) { if(!allowEdit) btnSubmit.classList.add('hidden'); else btnSubmit.classList.remove('hidden'); }
    
    let modLogistik = document.getElementById('logistikModal'); if(modLogistik) modLogistik.classList.remove('spa-hidden'); 
    initSelect2Global();
};

let formLogistikData = document.getElementById('formLogistik');
if(formLogistikData) {
    formLogistikData.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        if(typeof Swal !== 'undefined') Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
        const d = masterData.find(m => m.id_pendaftaran === logistikId); const currentUser = JSON.parse(sessionStorage.getItem('spmb_session'));
        let selectedAttr = []; document.querySelectorAll('input[name="chk_logistik_attr"]:checked').forEach(c => selectedAttr.push(c.value));
        const payload = new URLSearchParams(); payload.append('action', 'update_seragam'); payload.append('id_pendaftaran', logistikId); payload.append('ukuran_atas_osis', d.ukuran_atas_osis); payload.append('ukuran_bawah_osis', d.ukuran_bawah_osis); payload.append('ukuran_atas_or', d.ukuran_atas_or); payload.append('ukuran_bawah_or', d.ukuran_bawah_or); 
        let statOsis = document.getElementById('stat_osis') ? document.getElementById('stat_osis').value : "Belum"; let statOr = document.getElementById('stat_or') ? document.getElementById('stat_or').value : "Belum"; let dKpd = document.getElementById('diserahkan_kepada') ? document.getElementById('diserahkan_kepada').value : "";
        payload.append('status_osis', statOsis); payload.append('status_or', statOr); payload.append('atribut_lengkap', selectedAttr.join(",")); payload.append('diserahkan_kepada', dKpd); payload.append('petugas_seragam', currentUser.nama_lengkap);
        try {
            const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const r = await res.json();
            if(r.status === 'success') { 
                if(typeof Swal !== 'undefined') Swal.fire('Berhasil!', 'Penyerahan dicatat.', 'success'); 
                let modLg = document.getElementById('logistikModal'); if(modLg) modLg.classList.add('spa-hidden'); 
                window.loadMasterData(false); 
            } else { if(typeof Swal !== 'undefined') Swal.fire('Gagal', r.message, 'error'); }
        } catch (err) { if(typeof Swal !== 'undefined') Swal.fire('Error', 'Terjadi kesalahan jaringan.', 'error'); }
    });
}

window.loadUsersData = async function() {
    try {
        const res = await fetch(SCRIPT_URL.trim() + "?action=get_users"); const r = await res.json();
        if(r.status === 'success') {
            const tbody = document.getElementById('tableUsersBody'); if(!tbody) return; tbody.innerHTML = ''; let rolesData = {}; let activeCount = r.data.length;
            r.data.forEach(u => { rolesData[u.role] = (rolesData[u.role] || 0) + 1; tbody.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="p-3 font-semibold">${u.username}</td><td class="p-3">${u.nama}</td><td class="p-3"><span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">${u.role}</span></td><td class="p-3">${u.tim || '-'}</td><td class="p-3 text-center whitespace-nowrap"><button type="button" onclick="window.editUser('${u.username}', '${u.password}', '${u.nama}', '${u.role}', '${u.tim}')" class="text-amber-500 hover:text-amber-700 bg-amber-50 p-1.5 rounded mr-1"><i class="ph ph-pencil-simple text-lg"></i></button><button type="button" onclick="window.deleteUser('${u.username}')" class="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"><i class="ph ph-trash text-lg"></i></button></td></tr>`; });
            const uStats = document.getElementById('usersStatsContainer');
            if(uStats) { uStats.innerHTML = `<div class="bg-slate-800 p-4 border border-slate-700 rounded-xl shadow-sm"><p class="text-xs text-slate-300 font-bold uppercase tracking-wider">Total Pengguna</p><h4 class="text-3xl font-bold text-white mt-1">${activeCount}</h4></div>`; Object.keys(rolesData).forEach(role => { uStats.innerHTML += `<div class="bg-white p-4 border border-slate-200 rounded-xl shadow-sm"><p class="text-xs text-slate-500 font-bold uppercase tracking-wider">${role}</p><h4 class="text-2xl font-bold text-blue-600 mt-1">${rolesData[role]}</h4></div>`; }); }
        }
    } catch(e) {}
};

let fAddUser = document.getElementById('formAddUser');
if(fAddUser) {
    fAddUser.addEventListener('submit', async(e) => {
        e.preventDefault(); 
        if(typeof Swal !== 'undefined') Swal.fire({ title: 'Membuat User...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
        let uUser = document.getElementById('u_username') ? document.getElementById('u_username').value : ""; let uPass = document.getElementById('u_password') ? document.getElementById('u_password').value : ""; let uNama = document.getElementById('u_nama') ? document.getElementById('u_nama').value : ""; let uRole = document.getElementById('u_role') ? document.getElementById('u_role').value : ""; let uTim = document.getElementById('u_tim') ? document.getElementById('u_tim').value : "";
        const payload = new URLSearchParams(); payload.append('action', 'save_user'); payload.append('u_username', uUser); payload.append('u_password', uPass); payload.append('u_nama', uNama); payload.append('u_role', uRole); payload.append('u_tim', uTim);
        try {
            const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); const r = await res.json();
            if(r.status === 'success') { if(typeof Swal !== 'undefined') Swal.fire('Berhasil!', 'Pengguna ditambah!', 'success'); fAddUser.reset(); window.loadUsersData(); } else { if(typeof Swal !== 'undefined') Swal.fire('Gagal', r.message, 'error'); }
        } catch(e) { if(typeof Swal !== 'undefined') Swal.fire('Error', 'Error koneksi', 'error'); }
    });
}

window.editUser = function(username, password, nama, role, tim) {
    if(document.getElementById('edit_old_username')) document.getElementById('edit_old_username').value = username; 
    if(document.getElementById('edit_u_username')) document.getElementById('edit_u_username').value = username; 
    if(document.getElementById('edit_u_password')) document.getElementById('edit_u_password').value = password; 
    if(document.getElementById('edit_u_nama')) document.getElementById('edit_u_nama').value = nama;
    window.setSelect2Value('edit_u_role', role);
    if(document.getElementById('edit_u_tim')) document.getElementById('edit_u_tim').value = tim === '-' ? '' : tim; 
    let mEu = document.getElementById('modalEditUser'); if(mEu) mEu.classList.remove('spa-hidden'); initSelect2Global();
};

let fEditUser = document.getElementById('formEditUserLogic');
if(fEditUser) {
    fEditUser.addEventListener('submit', async(e) => {
        e.preventDefault(); 
        if(typeof Swal !== 'undefined') Swal.fire({ title: 'Menyimpan Perubahan...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
        let eOldUser = document.getElementById('edit_old_username') ? document.getElementById('edit_old_username').value : ""; let eUser = document.getElementById('edit_u_username') ? document.getElementById('edit_u_username').value : ""; let ePass = document.getElementById('edit_u_password') ? document.getElementById('edit_u_password').value : ""; let eNama = document.getElementById('edit_u_nama') ? document.getElementById('edit_u_nama').value : ""; let eRole = document.getElementById('edit_u_role') ? document.getElementById('edit_u_role').value : ""; let eTim = document.getElementById('edit_u_tim') ? document.getElementById('edit_u_tim').value : "";
        const payload = new URLSearchParams(); payload.append('action', 'update_user'); payload.append('old_username', eOldUser); payload.append('u_username', eUser); payload.append('u_password', ePass); payload.append('u_nama', eNama); payload.append('u_role', eRole); payload.append('u_tim', eTim);
        try {
            const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); const r = await res.json();
            if(r.status === 'success') { 
                if(typeof Swal !== 'undefined') Swal.fire('Berhasil!', 'Data Pengguna diubah!', 'success'); 
                let mEu = document.getElementById('modalEditUser'); if(mEu) mEu.classList.add('spa-hidden'); window.loadUsersData(); 
            } else { if(typeof Swal !== 'undefined') Swal.fire('Gagal', r.message, 'error'); }
        } catch(e) { if(typeof Swal !== 'undefined') Swal.fire('Error', 'Error koneksi', 'error'); }
    });
}

window.deleteUser = async function(username) {
    if(typeof Swal === 'undefined') return;
    const result = await Swal.fire({ title: 'Hapus User?', text: `Anda yakin ingin menghapus akses login untuk: ${username}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b', confirmButtonText: 'Ya, Hapus!' });
    if (!result.isConfirmed) return;
    Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
    const payload = new URLSearchParams(); payload.append('action', 'delete_user'); payload.append('u_username', username);
    try {
        const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); const r = await res.json();
        if(r.status === 'success') { Swal.fire('Terhapus!', 'Pengguna berhasil dihapus!', 'success'); window.loadUsersData(); } else Swal.fire('Gagal', r.message, 'error');
    } catch(e) { Swal.fire('Error', 'Koneksi terputus', 'error'); }
};
