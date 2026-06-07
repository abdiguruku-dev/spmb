// ========================================================
// KONFIGURASI UTAMA
// ========================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxeLmwjgrv39zeSr5pYhuXGKpngkhfLmlFanwhuq9fe-mxd6rKErI2491D3cF5yAvMv/exec";

let masterData = [], visitData = [], stockData = [];
let editModeId = null, logistikId = null, selectedVisitId = null;
let currentUserTeam = "", currentUserRole = "";

const listAtributLogistik = ["Topi", "Dasi", "Ikat Pinggang", "Bet Identitas", "Bet Nama OSIS", "Bet Nama Identitas", "Bet Nama Pramuka", "Bet Nama Sekolah", "Kerudung OSIS", "Kerudung Olahraga", "Kerudung Identitas", "Kerudung Pramuka"];
const baseItemsLogistik = ["Atasan OSIS", "Bawahan OSIS", "Atasan Olahraga", "Bawahan Olahraga", ...listAtributLogistik];

// ========================================================
// UI KONTROL (SIDEBAR & TOAST/ALERT MODERN)
// ========================================================
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeMenu = () => { if(sidebar) sidebar.classList.add('-translate-x-full'); if(sidebarOverlay) sidebarOverlay.classList.add('hidden'); };

if(document.getElementById('btnOpenSidebar')) document.getElementById('btnOpenSidebar').addEventListener('click', () => { if(sidebar) sidebar.classList.remove('-translate-x-full'); if(sidebarOverlay) sidebarOverlay.classList.remove('hidden'); });
if(document.getElementById('btnCloseSidebar')) document.getElementById('btnCloseSidebar').addEventListener('click', closeMenu);
if(sidebarOverlay) sidebarOverlay.addEventListener('click', closeMenu);

// Fungsi pembungkus SweetAlert (Anti-Crash jika library gagal load)
function showModernAlert(type, title, text, html = null) {
    if (typeof Swal !== 'undefined') {
        let config = { icon: type, title: title, confirmButtonColor: '#2563eb' };
        if(html) config.html = html; else config.text = text;
        return Swal.fire(config);
    } else {
        alert(title + "\n" + (text || ""));
        return Promise.resolve({ isConfirmed: true });
    }
}

function showModernLoading(title = 'Memproses...') {
    if (typeof Swal !== 'undefined') Swal.fire({ title: title, allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
}

function closeModernLoading() {
    if (typeof Swal !== 'undefined') Swal.close();
}

function showToast(message, type = 'success') {
    if (typeof Swal !== 'undefined') {
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }).fire({ icon: type, title: message });
    } else alert(message);
}

// ========================================================
// SESSION & PASSWORD VISIBILITY
// ========================================================
const IDLE_TIMEOUT = 15 * 60 * 1000;
function resetIdleTimer() { const lv = document.getElementById('loginView'); if(!lv || !lv.classList.contains('spa-hidden')) return; sessionStorage.setItem('lastActiveTime', Date.now()); }
function checkIdleTime() {
    const lv = document.getElementById('loginView');
    if(lv && lv.classList.contains('spa-hidden')) {
        const lastAct = sessionStorage.getItem('lastActiveTime');
        if (lastAct && (Date.now() - parseInt(lastAct) >= IDLE_TIMEOUT)) {
            document.getElementById('btnLogout').click();
            showModernAlert('warning', 'Sesi Berakhir', 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit.');
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
        if(pwd.type === 'password') { pwd.type = 'text'; icon.classList.replace('ph-eye', 'ph-eye-slash'); } else { pwd.type = 'password'; icon.classList.replace('ph-eye-slash', 'ph-eye'); }
    });
}

// ========================================================
// SWITCH VIEW & SELECT2
// ========================================================
function switchView(viewName) {
    const views = ['viewDashboard', 'viewTabel', 'viewForm', 'viewKelolaVisit', 'viewStokLogistik', 'viewLogistik', 'viewVisitGuru', 'viewHasilVisit', 'viewRiwayatVisit', 'viewSettings'];
    views.forEach(v => { const el = document.getElementById(v); if(el) el.classList.add('spa-hidden'); });
    const navs = ['navDashboard', 'navTabel', 'navKelolaVisit', 'navStokLogistik', 'navLogistik', 'navVisitGuru', 'navHasilVisit', 'navRiwayatVisit', 'navSettings'];
    navs.forEach(n => { const el = document.getElementById(n); if(el) el.classList.remove('bg-blue-50','text-blue-700'); });
    
    const vTgt = document.getElementById('view' + viewName.charAt(0).toUpperCase() + viewName.slice(1)); if(vTgt) vTgt.classList.remove('spa-hidden');
    const nTgt = document.getElementById('nav' + viewName.charAt(0).toUpperCase() + viewName.slice(1)); if(nTgt) nTgt.classList.add('bg-blue-50','text-blue-700');
    if(window.innerWidth < 768) closeMenu();
}

function initSelect2Global() {
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
}

function setSelect2Value(id, value) {
    if (typeof $ === 'undefined') return; let el = $('#' + id); if (!el.length) return;
    if (!value || value === "-" || value === "") { el.val('').trigger('change'); return; }
    if (el.find("option[value='" + value + "']").length) { el.val(value).trigger('change'); } else { var newOpt = new Option(value, value, true, true); el.append(newOpt).trigger('change'); } 
}

function safeVal(id, def = "") { const el = document.getElementById(id); return el ? el.value : def; }

// ========================================================
// CORE: PENDAFTAR MURID BARU & EDIT DATA
// ========================================================
function toggleWali(status) {
    const formWali = document.getElementById('formWali'); if(!formWali) return;
    if (status === "Bersama Wali/Kerabat") { formWali.classList.remove('hidden'); } else { formWali.classList.add('hidden'); if(document.getElementById('nama_wali')) document.getElementById('nama_wali').value = ''; if(document.getElementById('hp_wali')) document.getElementById('hp_wali').value = ''; if(document.getElementById('alamat_wali')) document.getElementById('alamat_wali').value = ''; }
}

function bukaFormBaru() {
    editModeId = null; const form = document.getElementById('muridForm'); if(form) form.reset(); 
    document.querySelectorAll('input[name="chk_entitas"]').forEach(c => c.checked = false); 
    toggleWali('Bersama Orang Tua'); 
    const fTitle = document.getElementById('formTitle'); if(fTitle) fTitle.innerHTML = `<i class="ph-fill ph-file-plus text-blue-600"></i> Input Pendaftaran Murid Baru`; 
    const btnSubmit = document.getElementById('btnSubmitMurid'); if(btnSubmit) btnSubmit.innerHTML = `<i class="ph ph-floppy-disk text-xl"></i> Simpan Data Pendaftar`; 
    switchView('form'); if (typeof $ !== 'undefined') $('select').trigger('change');
}

const muridForm = document.getElementById('muridForm');
if(muridForm) {
    muridForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const btnSubmit = document.getElementById('btnSubmitMurid'); 
        if(btnSubmit) btnSubmit.disabled = true;
        
        showModernLoading(editModeId ? 'Memperbarui Data...' : 'Menyimpan Data...');
        
        let entitasTerpilih = []; document.querySelectorAll('input[name="chk_entitas"]:checked').forEach(chk => entitasTerpilih.push(chk.value)); 
        const payload = new URLSearchParams(); 
        if (editModeId) { payload.append('action', 'update_murid'); payload.append('id_pendaftaran', editModeId); } else { payload.append('action', 'insert_murid'); }
        
        let sess = sessionStorage.getItem('spmb_session'); let petugasName = sess ? JSON.parse(sess).nama_lengkap : "Unknown";
        payload.append('petugas_input', petugasName); payload.append('nama_lengkap', safeVal('nama_lengkap')); payload.append('jenis_kelamin', safeVal('jenis_kelamin')); payload.append('nisn', safeVal('nisn')); payload.append('nik', safeVal('nik')); payload.append('tempat_lahir', safeVal('tempat_lahir')); payload.append('tanggal_lahir', safeVal('tanggal_lahir')); payload.append('agama', safeVal('agama')); payload.append('no_hp_murid', safeVal('no_hp_murid')); 
        let dusun = safeVal('alamat_dusun'); let rt = safeVal('alamat_rt'); let rw = safeVal('alamat_rw');
        payload.append('alamat_lengkap', `Dusun ${dusun}, RT ${rt}/RW ${rw}`); 
        payload.append('desa_kelurahan', safeVal('desa_kelurahan')); payload.append('kecamatan', safeVal('kecamatan')); payload.append('jenis_tinggal', safeVal('jenis_tinggal')); payload.append('nama_wali', safeVal('nama_wali')); payload.append('hp_wali', safeVal('hp_wali')); payload.append('alamat_wali', safeVal('alamat_wali')); payload.append('no_hp_ortu', safeVal('no_hp_ortu')); payload.append('nama_ayah', safeVal('nama_ayah')); payload.append('pekerjaan_ayah', safeVal('pekerjaan_ayah')); payload.append('status_ayah', safeVal('status_ayah')); payload.append('nama_ibu', safeVal('nama_ibu')); payload.append('pekerjaan_ibu', safeVal('pekerjaan_ibu')); payload.append('status_ibu', safeVal('status_ibu')); payload.append('asal_sekolah', safeVal('asal_sekolah')); payload.append('status_bantuan', safeVal('status_bantuan')); payload.append('entitas_pembawa', entitasTerpilih.join(", "));
        
        ['atas_osis', 'bawah_osis', 'atas_or', 'bawah_or'].forEach(u => { payload.append(`ukuran_${u}`, safeVal(`ukur_${u}`, '-')); }); 
        ['formulir', 'skl', 'nilai', 'tka', 'foto', 'ijazah', 'kk', 'akte', 'bantuan'].forEach(b => { payload.append(`berkas_${b}`, safeVal(`berkas_${b}`, 'Belum Ada')); });
        
        try {
            const response = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const result = await response.json();
            if(result.status === 'success') {
                if(typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: editModeId ? 'Berhasil Diperbarui!' : 'Berhasil Disimpan!',
                        html: `Data telah tersimpan ke database.<br><br><b>ID: ${editModeId ? editModeId : result.data.id_pendaftaran}</b>`,
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonColor: '#2563eb',
                        cancelButtonColor: '#64748b',
                        confirmButtonText: editModeId ? 'Kembali ke Tabel' : 'Input Pendaftar Lain',
                        cancelButtonText: 'Tutup'
                    }).then((resSwal) => {
                        editModeId = null; muridForm.reset(); 
                        if (resSwal.isConfirmed) { if(editModeId) { switchView('tabel'); } else { bukaFormBaru(); } } else { switchView('tabel'); }
                    });
                } else {
                    alert("Sukses menyimpan data."); editModeId = null; muridForm.reset(); switchView('tabel');
                }
                loadMasterData(false);
            } else { showModernAlert('error', 'Gagal', result.message); }
        } catch (err) { showModernAlert('error', 'Koneksi Terputus', err.message); } finally { if(btnSubmit) btnSubmit.disabled = false; }
    });
}

function editData(id) {
    try {
        const data = masterData.find(m => m.id_pendaftaran === id); 
        if(!data) { showModernAlert('error', 'Error', 'Data tidak ditemukan.'); return; }
        
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
        
        setSelect2Value('desa_kelurahan', data.desa_kelurahan); 
        setSelect2Value('kecamatan', data.kecamatan);
        
        if(data.jenis_tinggal && document.getElementById('jenis_tinggal')) { document.getElementById('jenis_tinggal').value = data.jenis_tinggal; toggleWali(data.jenis_tinggal); }
        
        if(document.getElementById('nama_wali')) document.getElementById('nama_wali').value = data.nama_wali || ""; 
        if(document.getElementById('hp_wali')) document.getElementById('hp_wali').value = data.hp_wali || ""; 
        if(document.getElementById('alamat_wali')) document.getElementById('alamat_wali').value = data.alamat_wali || ""; 
        if(document.getElementById('no_hp_ortu')) document.getElementById('no_hp_ortu').value = data.no_hp_ortu || ""; 
        if(document.getElementById('nama_ayah')) document.getElementById('nama_ayah').value = data.nama_ayah || ""; 
        
        setSelect2Value('pekerjaan_ayah', data.pekerjaan_ayah); 
        if(document.getElementById('status_ayah')) document.getElementById('status_ayah').value = data.status_ayah || "Masih Hidup"; 
        if(document.getElementById('nama_ibu')) document.getElementById('nama_ibu').value = data.nama_ibu || ""; 
        
        setSelect2Value('pekerjaan_ibu', data.pekerjaan_ibu); 
        if(document.getElementById('status_ibu')) document.getElementById('status_ibu').value = data.status_ibu || "Masih Hidup"; 
        
        setSelect2Value('asal_sekolah', data.asal_sekolah);
        if(document.getElementById('status_bantuan')) document.getElementById('status_bantuan').value = data.status_bantuan || "Tidak Ada"; 
        
        const arrEntitas = (data.entitas_pembawa || "").split(", "); document.querySelectorAll('input[name="chk_entitas"]').forEach(chk => { chk.checked = arrEntitas.includes(chk.value); });
        ['atas_osis', 'bawah_osis', 'atas_or', 'bawah_or'].forEach(u => { let el = document.getElementById(`ukur_${u}`); if(el) el.value = data[`ukuran_${u}`] || '-'; }); 
        ['formulir', 'skl', 'nilai', 'tka', 'foto', 'ijazah', 'kk', 'akte', 'bantuan'].forEach(b => { let el = document.getElementById(`berkas_${b}`); if(el) el.value = data[`berkas_${b}`] || 'Belum Ada'; });
        
        switchView('form'); if (typeof $ !== 'undefined') $('select').trigger('change');
    } catch(e) { console.error("Edit form crash:", e); }
}

async function deleteData(id) {
    if(typeof Swal === 'undefined') { if(!confirm(`Hapus permanen data ${id}?`)) return; } 
    else {
        const result = await Swal.fire({ title: 'Hapus Permanen?', text: `Anda yakin ingin menghapus data ${id}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b', confirmButtonText: 'Ya, Hapus!' });
        if (!result.isConfirmed) return;
    }
    
    showModernLoading('Menghapus data...');
    try {
        const payload = new URLSearchParams(); payload.append('action', 'delete_murid'); payload.append('id_pendaftaran', id);
        const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const r = await res.json();
        if(r.status === 'success') { showModernAlert('success', 'Terhapus!', 'Data berhasil dihapus secara permanen.'); loadMasterData(false); } 
        else { showModernAlert('error', 'Gagal', r.message); }
    } catch(e) { showModernAlert('error', 'Error', 'Koneksi terputus'); }
}

// ========================================================
// PROFIL PENGGUNA (GANTI FOTO & PASSWORD)
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
        
        showModernLoading('Memperbarui Profil...');
        const userStr = sessionStorage.getItem('spmb_session'); if(!userStr) return; const user = JSON.parse(userStr);
        const payload = new URLSearchParams(); payload.append('action', 'update_profile'); payload.append('username', user.username); payload.append('new_password', newPass); payload.append('foto_profil', fotoUrl);

        try {
            const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const r = await res.json();
            if(r.status === 'success') {
                sessionStorage.setItem('spmb_session', JSON.stringify(r.data)); tampilkanApp(r.data);
                if(document.getElementById('modalProfile')) document.getElementById('modalProfile').classList.add('spa-hidden');
                showModernAlert('success', 'Berhasil!', 'Profil Anda telah diperbarui.');
            } else { showModernAlert('error', 'Gagal', r.message); }
        } catch(err) { showModernAlert('error', 'Error', 'Gagal menghubungi server.'); } finally { if(btn) { btn.disabled = false; btn.innerText = "Simpan Profil"; } }
    });
}

// ========================================================
// IMPORT TARGET EXCEL
// ========================================================
function downloadFormatExcel() {
    const ws_data = [ ["Tim_Alokasi", "Nama_Lengkap", "L_P", "Asal_Sekolah", "Nama_Ayah", "Nama_Ibu", "Alamat", "Tanggal_Mulai", "Batas_Waktu", "Desa_Kelurahan", "Kecamatan"], ["Tim 1", "Budi Santoso", "Laki-laki", "SD Negeri 1 Kebumen", "Joko", "Siti", "Dusun Krajan RT 01 RW 02", "2024-05-01", "2024-05-15", "Aditirto", "Pejagoan"] ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wscols = [ {wch: 15}, {wch: 25}, {wch: 10}, {wch: 25}, {wch: 20}, {wch: 20}, {wch: 35}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 20} ];
    ws['!cols'] = wscols; const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data_Target_Visit"); XLSX.writeFile(wb, "Format_Import_Visit.xlsx");
}

const btnImportExcel = document.getElementById('btnImportExcel');
if(btnImportExcel) {
    btnImportExcel.addEventListener('click', () => {
        const fileInput = document.getElementById('fileExcelVisit');
        if(!fileInput || !fileInput.files.length) { showModernAlert('warning', 'Perhatian', 'Pilih file Excel terlebih dahulu!'); return; }
        showModernLoading('Memproses Excel...');
        const file = fileInput.files[0]; const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, {type: 'array'});
                const sheetName = workbook.SheetNames[0]; const worksheet = workbook.Sheets[sheetName]; const json = XLSX.utils.sheet_to_json(worksheet, {raw: false});
                if(json.length === 0) throw new Error("Excel Kosong");
                const payload = new URLSearchParams(); payload.append('action', 'import_target_visit'); payload.append('data_json', JSON.stringify(json));
                const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const r = await res.json();
                if(r.status === 'success') { showModernAlert('success', 'Berhasil!', r.message); fileInput.value = ""; loadVisitData(false); } else { showModernAlert('error', 'Gagal', r.message); }
            } catch(err) { showModernAlert('error', 'Format Salah', 'Gagal memproses file Excel. Pastikan format benar.'); }
        };
        reader.readAsArrayBuffer(file);
    });
}

// ========================================================
// CORE: GLOBAL LOGIN & SETUP APP
// ========================================================
function applySettings(settings) {
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
}

document.addEventListener('DOMContentLoaded', async () => { 
    initSelect2Global();
    if (typeof $ !== 'undefined') { document.addEventListener('reset', function(e) { setTimeout(() => { $(e.target).find('select').trigger('change'); }, 10); }); }
    try { const s = await fetch(SCRIPT_URL.trim() + "?action=get_settings"); const textRes = await s.text(); const sRes = JSON.parse(textRes); if(sRes.status === 'success') applySettings(sRes.data); } catch(e){}
    const saved = sessionStorage.getItem('spmb_session'); if(saved) { tampilkanApp(JSON.parse(saved)); startAutoSync(); }
    const chkContainer = document.getElementById('checklistAtributContainer');
    if(chkContainer) { listAtributLogistik.forEach(attr => { chkContainer.innerHTML += `<label class="flex items-center space-x-2 text-sm bg-slate-50 p-2 rounded border cursor-pointer hover:bg-slate-100"><input type="checkbox" name="chk_logistik_attr" value="${attr}" class="rounded text-blue-600 focus:ring-blue-500"><span>${attr}</span></label>`; }); }
});

const loginForm = document.getElementById('loginForm');
if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const uIn = document.getElementById('username') ? document.getElementById('username').value.trim() : "";
        const pIn = document.getElementById('password') ? document.getElementById('password').value.trim() : "";
        if(!uIn || !pIn) { showModernAlert('warning', 'Perhatian', 'Username dan Password wajib diisi!'); return; }
        showModernLoading('Menghubungkan...');
        try {
            const fd = new URLSearchParams(); fd.append('action', 'login'); fd.append('username', uIn); fd.append('password', pIn);
            const response = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: fd }); const textRes = await response.text(); 
            let result; try { result = JSON.parse(textRes); } catch(e) { throw new Error("Akses diblokir oleh sistem atau URL salah."); }
            if (result.status === 'success') { 
                sessionStorage.setItem('spmb_session', JSON.stringify(result.data)); sessionStorage.setItem('lastActiveTime', Date.now()); 
                closeModernLoading(); tampilkanApp(result.data); startAutoSync(); 
            } else { showModernAlert('error', 'Login Gagal', result.message); } 
        } catch (err) { showModernAlert('error', 'Koneksi Bermasalah', err.message); }
    });
}

const btnLogout = document.getElementById('btnLogout');
if(btnLogout) { btnLogout.addEventListener('click', () => { sessionStorage.removeItem('spmb_session'); sessionStorage.removeItem('lastActiveTime'); if(window.syncInterval) clearInterval(window.syncInterval); location.reload(); }); }

async function tampilkanApp(userData) {
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
        loadUsersData(); 
    } else if (roleStr === "kepala sekolah" || roleStr === "ketua panitia") {
        ['navTabel', 'navStokLogistik', 'navLogistik'].forEach(n => { const el = document.getElementById(n); if(el) el.classList.remove('hidden'); });
        if(document.getElementById('labelMenuLogistik')) document.getElementById('labelMenuLogistik').classList.remove('hidden');
        ['berkasPanel', 'logistikPanel'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.remove('hidden'); });
        const btnTambah = document.getElementById('btnTambahPendaftarUtama'); if(btnTambah) btnTambah.classList.add('hidden'); 
    } else if (roleStr === "admin input") {
        if(document.getElementById('navTabel')) document.getElementById('navTabel').classList.remove('hidden'); if(document.getElementById('navKelolaVisit')) document.getElementById('navKelolaVisit').classList.remove('hidden'); if(document.getElementById('btnTambahPendaftarUtama')) document.getElementById('btnTambahPendaftarUtama').classList.remove('hidden'); if(document.getElementById('berkasPanel')) document.getElementById('berkasPanel').classList.remove('hidden');
    } else if (roleStr === "petugas seragam" || roleStr === "logistik") {
        if(document.getElementById('navTabel')) document.getElementById('navTabel').classList.remove('hidden'); if(document.getElementById('navStokLogistik')) document.getElementById('navStokLogistik').classList.remove('hidden'); if(document.getElementById('navLogistik')) document.getElementById('navLogistik').classList.remove('hidden'); if(document.getElementById('labelMenuLogistik')) document.getElementById('labelMenuLogistik').classList.remove('hidden'); if(document.getElementById('logistikPanel')) document.getElementById('logistikPanel').classList.remove('hidden'); if(document.getElementById('btnTambahPendaftarUtama')) document.getElementById('btnTambahPendaftarUtama').classList.add('hidden');
    } else if (roleStr === "guru") {
        if(document.getElementById('navTabel')) document.getElementById('navTabel').classList.remove('hidden'); if(document.getElementById('btnTambahPendaftarUtama')) document.getElementById('btnTambahPendaftarUtama').classList.add('hidden');
    }

    if (currentUserTeam.trim() !== "" || roleStr === "administrator" || roleStr === "kepala sekolah" || roleStr === "ketua panitia") {
        if(document.getElementById('navVisitGuru')) document.getElementById('navVisitGuru').classList.remove('hidden'); if(document.getElementById('navHasilVisit')) document.getElementById('navHasilVisit').classList.remove('hidden'); if(document.getElementById('navRiwayatVisit')) document.getElementById('navRiwayatVisit').classList.remove('hidden'); if(document.getElementById('labelMenuVisit')) document.getElementById('labelMenuVisit').classList.remove('hidden');
        loadVisitData(false);
    }
    switchView('dashboard'); fetchReferences(); await loadStokData(); await loadMasterData(false);
}

const formSettings = document.getElementById('formSettings');
if(formSettings) {
    formSettings.addEventListener('submit', async(e) => {
        e.preventDefault(); 
        showModernLoading('Menyimpan Pengaturan...');
        const payload = new URLSearchParams(); payload.append('action', 'save_settings'); payload.append('app_name', document.getElementById('set_app_name') ? document.getElementById('set_app_name').value : ""); payload.append('app_desc', document.getElementById('set_app_desc') ? document.getElementById('set_app_desc').value : ""); payload.append('logo_url', document.getElementById('set_logo_url') ? document.getElementById('set_logo_url').value : ""); payload.append('favicon_url', document.getElementById('set_favicon_url') ? document.getElementById('set_favicon_url').value : ""); payload.append('sekolah_nama', document.getElementById('set_sekolah_nama') ? document.getElementById('set_sekolah_nama').value : ""); payload.append('sekolah_akreditasi', document.getElementById('set_sekolah_akreditasi') ? document.getElementById('set_sekolah_akreditasi').value : ""); payload.append('sekolah_alamat', document.getElementById('set_sekolah_alamat') ? document.getElementById('set_sekolah_alamat').value : ""); payload.append('sekolah_email', document.getElementById('set_sekolah_email') ? document.getElementById('set_sekolah_email').value : ""); payload.append('sekolah_website', document.getElementById('set_sekolah_website') ? document.getElementById('set_sekolah_website').value : "");
        try {
            const res = await fetch(SCRIPT_URL.trim(), {method:'POST', body:payload}); const r = await res.json();
            if(r.status === 'success') { 
                showModernAlert('success', 'Berhasil!', 'Pengaturan tersimpan!');
                applySettings({ app_name: document.getElementById('set_app_name') ? document.getElementById('set_app_name').value : "", app_desc: document.getElementById('set_app_desc') ? document.getElementById('set_app_desc').value : "", logo_url: document.getElementById('set_logo_url') ? document.getElementById('set_logo_url').value : "", favicon_url: document.getElementById('set_favicon_url') ? document.getElementById('set_favicon_url').value : "", sekolah_nama: document.getElementById('set_sekolah_nama') ? document.getElementById('set_sekolah_nama').value : "", sekolah_akreditasi: document.getElementById('set_sekolah_akreditasi') ? document.getElementById('set_sekolah_akreditasi').value : "", sekolah_alamat: document.getElementById('set_sekolah_alamat') ? document.getElementById('set_sekolah_alamat').value : "", sekolah_email: document.getElementById('set_sekolah_email') ? document.getElementById('set_sekolah_email').value : "", sekolah_website: document.getElementById('set_sekolah_website') ? document.getElementById('set_sekolah_website').value : "" }); 
            } else { showModernAlert('error', 'Gagal', r.message); }
        } catch(err) { showModernAlert('error', 'Error', 'Gagal terhubung ke Server'); }
    });
}

function startAutoSync() {
    if(window.syncInterval) clearInterval(window.syncInterval);
    window.syncInterval = setInterval(async () => { if(sessionStorage.getItem('spmb_session')) { await loadStokData(); await loadMasterData(true); loadVisitData(true); } }, 10000); 
}

// ========================================================
// FUNGSI TARIK DATA & RENDER TABEL UTAMA
// ========================================================
async function fetchReferences() {
    try {
        const response = await fetch(SCRIPT_URL.trim() + "?action=get_references"); const result = await response.json();
        if(result.status === "success") {
            const populate = (id, data) => { const el = document.getElementById(id); if(el) { el.innerHTML = '<option value="">-- Pilih --</option>'; data.forEach(i => el.innerHTML += `<option value="${i}">${i}</option>`); } };
            populate('desa_kelurahan', result.data.desa); populate('v_desa', result.data.desa); populate('asal_sekolah', result.data.sekolah); populate('v_sd', result.data.sekolah); populate('v_tim', result.data.tim); populate('kecamatan', result.data.kecamatan); populate('v_kecamatan', result.data.kecamatan); populate('pekerjaan_ayah', result.data.pekerjaan); populate('pekerjaan_ibu', result.data.pekerjaan);
            const elCheck = document.getElementById('entitas_checkbox_container'); 
            if(elCheck) { 
                elCheck.innerHTML = ''; const combinedEntitas = [...(result.data.entitas || []), ...(result.data.individu || [])];
                combinedEntitas.forEach(item => { elCheck.innerHTML += `<label class="flex items-center space-x-2 text-sm bg-slate-50 p-2 rounded border cursor-pointer hover:bg-slate-100 transition-colors"><input type="checkbox" name="chk_entitas" value="${item}" class="rounded text-blue-600 focus:ring-blue-500"><span>${item}</span></label>`; }); 
            }
            const optGrp = document.getElementById('optgroupIndividu'); 
            if(optGrp) { optGrp.innerHTML = ''; if (result.data.individu) { result.data.individu.forEach(i => { optGrp.innerHTML += `<option value="${i}">${i}</option>`; }); } }
            if(result.data.kompetitor && result.data.kompetitor.length > 0) {
                ['pil_1', 'pil_2', 'pil_3'].forEach(id => { const el = document.getElementById(id); if(el) { el.innerHTML = '<option value="">-- Pilih --</option>'; result.data.kompetitor.forEach(s => el.innerHTML += `<option value="${s}">${s}</option>`); } });
            }
            if (typeof $ !== 'undefined') $('select').trigger('change');
        }
    } catch (error) { console.error(error); }
}

async function loadMasterData(isBackground = false) {
    try {
        const response = await fetch(SCRIPT_URL.trim() + "?action=get_master_data"); const result = await response.json();
        if (result.status === "success") { 
            masterData = result.data || []; 
            try { prosesDashboard(masterData); } catch(e){} try { renderDashboardStokCards(); } catch(e){} try { renderStokLogistik(); } catch(e){} 
            let searchInp = document.getElementById('searchInput'); let qUtama = searchInp ? searchInp.value.trim() : "";
            if (qUtama === "") { try { renderTabel(masterData); } catch(e){} }
            let logInp = document.getElementById('searchLogistik'); let qLog = logInp ? logInp.value.trim() : "";
            if (qLog === "") { try { renderLogistik(masterData); } catch(e){} }
        }
    } catch (error) {}
}

async function loadStokData() { try { const response = await fetch(SCRIPT_URL.trim() + "?action=get_stok"); const result = await response.json(); if (result.status === "success") { stockData = result.data || []; } } catch (error) {} }

async function loadVisitData(isBackground = false) {
    let roleFetch = currentUserRole.trim().toLowerCase(); if(!currentUserTeam && roleFetch !== 'administrator' && roleFetch !== 'kepala sekolah' && roleFetch !== 'ketua panitia') return;
    let timFetch = currentUserTeam;
    try {
        const response = await fetch(SCRIPT_URL.trim() + "?action=get_visit_data&tim=" + encodeURIComponent(timFetch) + "&role=" + encodeURIComponent(currentUserRole)); const result = await response.json();
        if (result.status === "success") { 
            visitData = result.data || []; 
            let sVis = document.getElementById('searchVisit'); let qV = sVis ? sVis.value.trim() : "";
            let sRiw = document.getElementById('searchRiwayatVisit'); let qR = sRiw ? sRiw.value.trim() : "";
            let sHas = document.getElementById('searchHasilVisit'); let qH = sHas ? sHas.value.trim() : "";
            if (qV === "" && qR === "" && qH === "") { try { renderVisitAndRiwayat(visitData); } catch(e){} }
        }
    } catch (error) {}
}

function renderTabel(data) {
    const tbody = document.getElementById('tableBody'); if(!tbody) return; tbody.innerHTML = '';
    if (!data || data.length === 0) { tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Tidak ada data pendaftar.</td></tr>`; return; }
    let rCheck = currentUserRole.trim().toLowerCase(); let isCrud = (rCheck === "administrator" || rCheck === "admin input"); let isDewa = (rCheck === "administrator");
    data.forEach(m => { 
        let safeId = m.id_pendaftaran;
        let viewBtn = `<button onclick="viewData('${safeId}')" class="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Resume Data Lengkap"><i class="ph ph-eye text-lg"></i></button>`;
        let editBtn = isCrud ? `<button onclick="editData('${safeId}')" class="text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg transition-colors" title="Edit Data"><i class="ph ph-pencil-simple text-lg"></i></button>` : '';
        let delBtn = isDewa ? `<button onclick="deleteData('${safeId}')" class="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Hapus Data"><i class="ph ph-trash text-lg"></i></button>` : '';
        let actionBtn = `<div class="flex justify-center gap-1">${viewBtn}${editBtn}${delBtn}</div>`;
        if(!isCrud && !isDewa) actionBtn = `<button onclick="viewData('${safeId}')" class="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 text-xs font-bold transition-colors shadow-sm"><i class="ph ph-eye text-sm align-middle"></i> Detail</button>`;
        tbody.innerHTML += `<tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100"><td class="p-3 font-medium text-slate-600">${safeId}</td><td class="p-3 font-semibold text-slate-900">${m.nama_lengkap}</td><td class="p-3 text-center text-slate-500">${m.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}</td><td class="p-3 text-slate-600">${m.desa_kelurahan || '-'}</td><td class="p-3 text-slate-600">${m.asal_sekolah || '-'}</td><td class="p-3 text-center">${actionBtn}</td></tr>`; 
    });
}

function filterTabel(keyword) {
    const infoFilter = document.getElementById('tableFilterInfo'); 
    if (!keyword) { if(infoFilter) infoFilter.innerText = "Menampilkan seluruh data murid"; renderTabel(masterData); return; }
    let filtered = [];
    if(keyword.startsWith('filter:')) { 
        let parts = keyword.split('='); let field = parts[0].split(':')[1]; let val = parts[1]; 
        filtered = masterData.filter(m => m[field] === val); 
        if(infoFilter) infoFilter.innerHTML = `Menyaring berdasarkan <span class="font-bold text-blue-600">${val}</span>`; 
    } else if (keyword.startsWith('missing:')) { 
        const f = keyword.split(':')[1]; filtered = masterData.filter(m => m[f] === "Belum Ada"); 
        if(infoFilter) infoFilter.innerHTML = `Menampilkan data murid dengan berkas <span class="text-red-600 font-semibold">Belum Lengkap</span>`; 
    } else { 
        const lowerKey = keyword.toLowerCase(); 
        filtered = masterData.filter(m => (m.nama_lengkap||"").toLowerCase().includes(lowerKey) || (m.id_pendaftaran||"").toLowerCase().includes(lowerKey) || (m.asal_sekolah||"").toLowerCase().includes(lowerKey)); 
        if(infoFilter) infoFilter.innerText = `Ditemukan ${filtered.length} hasil pencarian.`; 
    }
    renderTabel(filtered);
}

let searchInputTop = document.getElementById('searchInput');
if(searchInputTop) { searchInputTop.addEventListener('input', (e) => filterTabel(e.target.value.trim())); }

function viewData(id) {
    const d = masterData.find(m => m.id_pendaftaran === id); if(!d) return; 
    const content = document.getElementById('viewModalContent'); if(!content) return;
    const renderField = (label, val) => `<div><p class="text-slate-500 text-[10px] uppercase font-bold tracking-wider">${label}</p><p class="font-medium text-slate-800 text-sm">${val || '-'}</p></div>`;
    content.innerHTML = `<div class="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"><div><p class="text-sm text-blue-600 font-semibold">ID Pendaftaran</p><p class="text-2xl font-bold text-blue-900">${d.id_pendaftaran}</p></div><div class="text-left md:text-right"><p class="text-sm text-slate-500">Asal Sekolah</p><p class="font-semibold text-slate-800">${d.asal_sekolah || '-'}</p></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-8"><div class="space-y-6"><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-user"></i> Biodata Murid</h4><div class="grid grid-cols-2 gap-3"><div class="col-span-2">${renderField('Nama Lengkap', d.nama_lengkap)}</div>${renderField('Jenis Kelamin', d.jenis_kelamin)} ${renderField('Agama', d.agama)} ${renderField('Tempat Lahir', d.tempat_lahir)} ${renderField('Tanggal Lahir', d.tanggal_lahir ? new Date(d.tanggal_lahir).toLocaleDateString('id-ID') : '-')} ${renderField('NIK', d.nik)} ${renderField('NISN', d.nisn)} ${renderField('No HP Murid', d.no_hp_murid)}</div></div><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-house"></i> Domisili &amp; Wali</h4><div class="space-y-3">${renderField('Alamat Lengkap', d.alamat_lengkap)}<div class="grid grid-cols-2 gap-3">${renderField('Desa/Kelurahan', d.desa_kelurahan)} ${renderField('Kecamatan', d.kecamatan)}</div><div class="bg-slate-50 p-3 rounded mt-2">${renderField('Tempat Tinggal Saat Saat', d.jenis_tinggal)} ${d.jenis_tinggal === 'Bersama Wali/Kerabat' ? `<div class="mt-2 grid grid-cols-2 gap-2 border-t pt-2">${renderField('Nama Wali', d.nama_wali)}${renderField('HP Wali', d.hp_wali)}${renderField('Alamat Wali', d.alamat_wali)}</div>` : ''}</div></div></div></div><div class="space-y-6"><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-users"></i> Data Orang Tua</h4><div class="mb-3 p-2 bg-yellow-50 rounded border border-yellow-200">${renderField('No. HP Utama (Kontak Darurat)', d.no_hp_ortu)}</div><div class="grid grid-cols-2 gap-4"><div><p class="text-xs font-bold text-slate-700 mb-1 border-b pb-1">Data Ayah</p>${renderField('Nama', d.nama_ayah)} ${renderField('Pekerjaan', d.pekerjaan_ayah)} ${renderField('Status', d.status_ayah)}</div><div><p class="text-xs font-bold text-slate-700 mb-1 border-b pb-1">Data Ibu</p>${renderField('Nama', d.nama_ibu)} ${renderField('Pekerjaan', d.pekerjaan_ibu)} ${renderField('Status', d.status_ibu)}</div></div></div><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-t-shirt"></i> Seragam &amp; Akademik</h4><div class="grid grid-cols-2 gap-3 mb-3">${renderField('Status Bantuan', d.status_bantuan)}<div class="col-span-2">${renderField('Entitas Pembawa', d.entitas_pembawa)}</div></div><div class="grid grid-cols-4 gap-2 border-t pt-3">${renderField('Atas OSIS', d.ukuran_atas_osis)} ${renderField('Bawah OSIS', d.ukuran_bawah_osis)} ${renderField('Atas OR', d.ukuran_atas_or)} ${renderField('Bawah OR', d.ukuran_bawah_or)}</div><div class="col-span-4 mt-2 bg-slate-50 p-2 text-xs border rounded">${renderField('Checklist Atribut Tambahan', (d.atribut_lengkap || "").replace(/,/g, ', '))}</div></div></div></div><div class="border border-slate-200 rounded-lg p-4 bg-white shadow-sm mt-6"><h4 class="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2"><i class="ph-fill ph-folders text-amber-500"></i> Kelengkapan Dokumen Fisik</h4><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">${[ {key:'formulir', label:'Formulir'}, {key:'skl', label:'SKL'}, {key:'nilai', label:'Nilai'}, {key:'tka', label:'Hasil TKA'}, {key:'foto', label:'Foto 3x4'}, {key:'ijazah', label:'Ijazah'}, {key:'kk', label:'K. Keluarga'}, {key:'akte', label:'Akte'}, {key:'bantuan', label:'Bantuan'} ].map(k => { const val = d[`berkas_${k.key}`]; return `<div class="flex flex-col p-2 rounded ${val === 'Belum Ada' ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}"><span class="font-semibold text-xs text-slate-600 mb-1">${k.label}</span> <span class="${val === 'Belum Ada' ? 'text-red-600 font-bold text-xs' : 'text-green-600 font-semibold text-xs'}">${val}</span></div>`; }).join('')}</div></div>`;
    let modView = document.getElementById('viewModal'); if(modView) modView.classList.remove('spa-hidden');
}

function editData(id) {
    try {
        const data = masterData.find(m => m.id_pendaftaran === id); 
        if(!data) { showModernAlert('error', 'Error', 'Data tidak ditemukan.'); return; }
        
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
        
        setSelect2Value('desa_kelurahan', data.desa_kelurahan); 
        setSelect2Value('kecamatan', data.kecamatan);
        
        if(data.jenis_tinggal && document.getElementById('jenis_tinggal')) { document.getElementById('jenis_tinggal').value = data.jenis_tinggal; toggleWali(data.jenis_tinggal); }
        
        if(document.getElementById('nama_wali')) document.getElementById('nama_wali').value = data.nama_wali || ""; 
        if(document.getElementById('hp_wali')) document.getElementById('hp_wali').value = data.hp_wali || ""; 
        if(document.getElementById('alamat_wali')) document.getElementById('alamat_wali').value = data.alamat_wali || ""; 
        if(document.getElementById('no_hp_ortu')) document.getElementById('no_hp_ortu').value = data.no_hp_ortu || ""; 
        if(document.getElementById('nama_ayah')) document.getElementById('nama_ayah').value = data.nama_ayah || ""; 
        
        setSelect2Value('pekerjaan_ayah', data.pekerjaan_ayah); 
        if(document.getElementById('status_ayah')) document.getElementById('status_ayah').value = data.status_ayah || "Masih Hidup"; 
        if(document.getElementById('nama_ibu')) document.getElementById('nama_ibu').value = data.nama_ibu || ""; 
        
        setSelect2Value('pekerjaan_ibu', data.pekerjaan_ibu); 
        if(document.getElementById('status_ibu')) document.getElementById('status_ibu').value = data.status_ibu || "Masih Hidup"; 
        
        setSelect2Value('asal_sekolah', data.asal_sekolah);
        if(document.getElementById('status_bantuan')) document.getElementById('status_bantuan').value = data.status_bantuan || "Tidak Ada"; 
        
        const arrEntitas = (data.entitas_pembawa || "").split(", "); document.querySelectorAll('input[name="chk_entitas"]').forEach(chk => { chk.checked = arrEntitas.includes(chk.value); });
        ['atas_osis', 'bawah_osis', 'atas_or', 'bawah_or'].forEach(u => { let el = document.getElementById(`ukur_${u}`); if(el) el.value = data[`ukuran_${u}`] || '-'; }); 
        ['formulir', 'skl', 'nilai', 'tka', 'foto', 'ijazah', 'kk', 'akte', 'bantuan'].forEach(b => { let el = document.getElementById(`berkas_${b}`); if(el) el.value = data[`berkas_${b}`] || 'Belum Ada'; });
        
        switchView('form'); if (typeof $ !== 'undefined') $('select').trigger('change');
    } catch(e) { console.error("Edit form crash:", e); }
}

async function deleteData(id) {
    if(typeof Swal === 'undefined') { if(!confirm(`Hapus permanen data ${id}?`)) return; } 
    else {
        const result = await Swal.fire({ title: 'Hapus Permanen?', text: `Anda yakin ingin menghapus data ${id} secara permanen?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b', confirmButtonText: 'Ya, Hapus!' });
        if (!result.isConfirmed) return;
    }
    
    showModernLoading('Menghapus data...');
    try {
        const payload = new URLSearchParams(); payload.append('action', 'delete_murid'); payload.append('id_pendaftaran', id);
        const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const r = await res.json();
        if(r.status === 'success') { showModernAlert('success', 'Terhapus!', 'Data berhasil dihapus secara permanen.'); loadMasterData(false); } 
        else { showModernAlert('error', 'Gagal', r.message); }
    } catch(e) { showModernAlert('error', 'Error', 'Koneksi terputus'); }
}

// ========================================================
// FUNGSI RENDER TABEL & DASHBOARD STOK/VISIT
// ========================================================
window.tempDataGlobal = {}; 
function showDetailTable(title, globalKey) {
    let modTitle = document.getElementById('detailTableTitle'); if(modTitle) modTitle.innerHTML = `<i class="ph-fill ph-list-magnifying-glass"></i> ${title}`;
    const tbody = document.getElementById('detailTableBody'); if(!tbody) return; tbody.innerHTML = '';
    const dataList = window.tempDataGlobal[globalKey] || [];
    if(dataList.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400">Tidak ada data.</td></tr>'; } else {
        dataList.forEach(item => { tbody.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="p-3 text-slate-600">${item.id}</td><td class="p-3 font-semibold text-slate-800">${item.nama}</td><td class="p-3 text-center">${item.lp}</td><td class="p-3 text-slate-600">${item.desa || '-'}</td><td class="p-3 text-slate-600">${item.sekolah || '-'}</td></tr>`; });
    }
    let modDet = document.getElementById('modalDetailTable'); if(modDet) modDet.classList.remove('spa-hidden');
}

function prosesDashboard(data) {
    if(document.getElementById('statTotal')) document.getElementById('statTotal').innerText = data.length; 
    if(document.getElementById('statLaki')) document.getElementById('statLaki').innerText = data.filter(m => m.jenis_kelamin === "Laki-laki").length; 
    if(document.getElementById('statPerempuan')) document.getElementById('statPerempuan').innerText = data.filter(m => m.jenis_kelamin === "Perempuan").length;
    
    let rSD = {}; let rDesa = {};
    data.forEach(m => {
        let sd = m.asal_sekolah || "Tidak Diketahui"; let desa = m.desa_kelurahan || "Tidak Diketahui"; let jk = m.jenis_kelamin === "Laki-laki" ? "L" : "P";
        if(!rSD[sd]) rSD[sd] = {L:0, P:0, T:0}; rSD[sd][jk]++; rSD[sd].T++;
        if(!rDesa[desa]) rDesa[desa] = {L:0, P:0, T:0}; rDesa[desa][jk]++; rDesa[desa].T++;
    });
    
    const tbodySD = document.getElementById('bodyRekapSD'); 
    if(tbodySD) { 
        tbodySD.innerHTML = ''; Object.keys(rSD).sort((a,b) => rSD[b].T - rSD[a].T).forEach(k => { tbodySD.innerHTML += `<tr class="clickable-row border-b" onclick="doDrillDownUtama('asal_sekolah', '${k.replace(/'/g, "\\'")}')"><td class="p-3">${k}</td><td class="p-3 text-center">${rSD[k].L}</td><td class="p-3 text-center">${rSD[k].P}</td><td class="p-3 text-center font-bold text-blue-600">${rSD[k].T}</td></tr>`; });
    }
    const tbodyDesa = document.getElementById('bodyRekapDesa'); 
    if(tbodyDesa) { 
        tbodyDesa.innerHTML = ''; Object.keys(rDesa).sort((a,b) => rDesa[b].T - rDesa[a].T).forEach(k => { tbodyDesa.innerHTML += `<tr class="clickable-row border-b" onclick="doDrillDownUtama('desa_kelurahan', '${k.replace(/'/g, "\\'")}')"><td class="p-3">${k}</td><td class="p-3 text-center">${rDesa[k].L}</td><td class="p-3 text-center">${rDesa[k].P}</td><td class="p-3 text-center font-bold text-emerald-600">${rDesa[k].T}</td></tr>`; });
    }

    const berkasKunci = [{ key: 'berkas_formulir', label: 'Formulir Pendaftaran' }, { key: 'berkas_skl', label: 'Surat Kelulusan (SKL)' }, { key: 'berkas_nilai', label: 'Daftar Nilai' }, { key: 'berkas_tka', label: 'Hasil TKA' }, { key: 'berkas_foto', label: 'Foto 3x4' }, { key: 'berkas_ijazah', label: 'Ijazah Kelulusan' }, { key: 'berkas_kk', label: 'Kartu Keluarga (KK)' }, { key: 'berkas_akte', label: 'Akte Kelahiran' }, { key: 'berkas_bantuan', label: 'Bukti Bantuan' }];
    const containerBerkas = document.getElementById('berkasStatsContainer'); 
    if(containerBerkas) { 
        containerBerkas.innerHTML = '';
        berkasKunci.forEach(b => {
            let jlmBelum = data.filter(m => m[b.key] === "Belum Ada").length; let jlmAda = data.length - jlmBelum;
            const card = document.createElement('div'); card.className = `p-3 bg-white border rounded-xl shadow-sm border-l-4 ${jlmBelum > 0 ? 'border-l-red-500 hover:bg-red-50 cursor-pointer' : 'border-l-green-500'}`;
            card.innerHTML = `<p class="text-xs text-slate-500 font-semibold truncate mb-2">${b.label}</p><div class="flex justify-between items-center"><div><p class="text-[10px] text-slate-400 uppercase">Terkumpul</p><h4 class="text-lg font-bold text-green-600 leading-none">${jlmAda}</h4></div><div class="text-right"><p class="text-[10px] text-slate-400 uppercase">Kurang</p><h4 class="text-lg font-bold ${jlmBelum > 0 ? 'text-red-600' : 'text-slate-400'} leading-none">${jlmBelum}</h4></div></div>`;
            if (jlmBelum > 0) { card.onclick = () => { switchView('tabel'); let sInput = document.getElementById('searchInput'); if(sInput) sInput.value = `missing:${b.key}`; filterTabel(`missing:${b.key}`); }; } 
            containerBerkas.appendChild(card);
        });
    }
}

function renderDashboardStokCards() {
    try {
        const sizeContainer = document.getElementById('sizeStatsContainer'); const attrContainer = document.getElementById('attrStatsContainer');
        if(sizeContainer) sizeContainer.innerHTML = ''; if(attrContainer) attrContainer.innerHTML = '';

        if (!masterData || masterData.length === 0) return;

        let tallyKeluar = {}; let tallyKebutuhan = {}; let totalMurid = masterData.length; let selesai = 0;
        baseItemsLogistik.forEach(item => { tallyKeluar[item] = 0; tallyKebutuhan[item] = totalMurid; });
        let listBelumDetail = {}; baseItemsLogistik.forEach(item => listBelumDetail[item] = []);

        masterData.forEach(m => {
            let dAttr = m.atribut_lengkap || ""; let arrAttr = dAttr.toString().split(",").map(a => a.trim());
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
            document.getElementById('logStatTotal').innerText = totalMurid; 
            document.getElementById('logStatSelesai').innerText = selesai; 
            document.getElementById('logStatBelum').innerText = totalMurid - selesai;
        }

        baseItemsLogistik.forEach((item, index) => {
            let sData = (stockData || []).find(s => s.nama_barang === item) || {stok_awal: 0, barang_masuk: 0};
            let awal = parseInt(sData.stok_awal) || 0; let masuk = parseInt(sData.barang_masuk) || 0;
            let keluar = tallyKeluar[item]; let sisaStok = awal + masuk - keluar;
            let kebutuhanSisa = tallyKebutuhan[item] - keluar; if (kebutuhanSisa < 0) kebutuhanSisa = 0;
            let selisih = sisaStok - kebutuhanSisa;
            let badgeClass = "", statusText = "", icon = "";
            
            if (selisih >= 15) { badgeClass = "bg-green-50 border-green-200 text-green-800"; statusText = "Aman"; icon = "ph-check-circle text-green-500"; } 
            else if (selisih >= 0 && selisih < 15) { badgeClass = "bg-amber-50 border-amber-200 text-amber-800"; statusText = "Segera Restock"; icon = "ph-warning-circle text-amber-500"; } 
            else { badgeClass = "bg-red-50 border-red-200 text-red-800"; statusText = "Habis / Kurang"; icon = "ph-x-circle text-red-500"; }

            let globalKey = 'dashboard_belum_' + index; window.tempDataGlobal[globalKey] = listBelumDetail[item];
            let btnHtml = kebutuhanSisa > 0 ? `<button onclick="showDetailTable('Belum Dapat: ${item}', '${globalKey}')" class="w-full mt-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-1.5 rounded transition-colors shadow-sm">Lihat Siswa (${kebutuhanSisa})</button>` : `<div class="w-full mt-3 text-center text-xs text-green-600 font-bold py-1.5"><i class="ph-fill ph-check-circle align-middle"></i> Semua Sudah Dapat</div>`;
            let cardHtml = `<div class="p-4 border rounded-xl shadow-sm ${badgeClass} flex flex-col justify-between"><div><div class="flex justify-between items-start mb-2"><h4 class="font-bold text-sm tracking-tight">${item}</h4><i class="ph-fill ${icon} text-xl"></i></div><div class="grid grid-cols-2 gap-2 mt-3"><div class="bg-white/60 p-2 rounded text-center"><p class="text-[10px] uppercase font-bold opacity-70">Tersedia</p><p class="text-lg font-black">${sisaStok}</p></div><div class="bg-white/60 p-2 rounded text-center"><p class="text-[10px] uppercase font-bold opacity-70">Kebutuhan</p><p class="text-lg font-black">${kebutuhanSisa}</p></div></div><div class="mt-2 text-center text-xs font-bold py-1 bg-white/50 rounded">Status: ${statusText}</div></div>${btnHtml}</div>`;

            if (["Atasan OSIS", "Bawahan OSIS", "Atasan Olahraga", "Bawahan Olahraga"].includes(item)) { if(sizeContainer) sizeContainer.innerHTML += cardHtml; } else { if(attrContainer) attrContainer.innerHTML += cardHtml; }
        });
    } catch(e) { console.error("Crash on renderDashboardStokCards:", e); }
}

function renderStokLogistik() {
    try {
        const tbody = document.getElementById('tableStokBody'); if(!tbody) return; tbody.innerHTML = '';
        if(!masterData || !Array.isArray(masterData) || masterData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="p-8 text-center text-slate-500">Data pendaftar belum tersedia.</td></tr>';
            return;
        }
        
        let tallyKeluar = {}; let tallyKebutuhan = {}; let totalMurid = masterData.length;
        baseItemsLogistik.forEach(item => { tallyKeluar[item] = 0; tallyKebutuhan[item] = totalMurid; });

        masterData.forEach(m => {
            if(m.status_osis === 'Sudah') { tallyKeluar['Atasan OSIS']++; tallyKeluar['Bawahan OSIS']++; }
            if(m.status_or === 'Sudah') { tallyKeluar['Atasan Olahraga']++; tallyKeluar['Bawahan Olahraga']++; }
            let attrs = m.atribut_lengkap ? m.atribut_lengkap.toString().split(",") : [];
            attrs.forEach(a => { let k = a.trim(); if(tallyKeluar[k] !== undefined) tallyKeluar[k]++; });
        });

        let rCheck = (currentUserRole || "").trim().toLowerCase(); 
        let allowEdit = (rCheck === 'administrator' || rCheck === 'logistik' || rCheck === 'petugas seragam');

        baseItemsLogistik.forEach((item, index) => {
            let sData = (stockData || []).find(s => s.nama_barang === item) || {stok_awal: 0, barang_masuk: 0};
            let awal = parseInt(sData.stok_awal) || 0; let masuk = parseInt(sData.barang_masuk) || 0;
            let keluar = tallyKeluar[item] || 0; let butuh = (tallyKebutuhan[item] || 0) - keluar; if (butuh < 0) butuh = 0;
            let sisa = awal + masuk - keluar; let selisih = sisa - butuh;
            let ket = "Aman", badge = "bg-green-100 text-green-700 border-green-200";
            
            if (selisih < 0) { ket = "Habis / Kurang"; badge = "bg-red-100 text-red-700 border-red-200"; } 
            else if (selisih >= 0 && selisih < 15) { ket = "Segera Restock"; badge = "bg-amber-100 text-amber-700 border-amber-200"; }

            let btnEdit = allowEdit ? `<button onclick="editStok('${item}', ${awal}, ${masuk})" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded shadow text-xs font-bold transition-colors"><i class="ph ph-pencil-simple"></i> Edit</button>` : `<span class="text-xs text-slate-400 italic">Read-only</span>`;
            let globalKey = 'stok_belum_' + index; 
            let btnLihat = butuh > 0 ? `<button onclick="showDetailTable('Belum Dapat: ${item}', '${globalKey}')" class="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2 py-1 rounded shadow-sm text-xs font-bold transition-colors ml-1 mt-1 xl:mt-0"><i class="ph ph-users"></i> Siapa?</button>` : '';

            tbody.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="p-3 text-center">${index + 1}</td><td class="p-3 font-bold text-slate-800">${item}</td><td class="p-3 text-center text-slate-600">${awal}</td><td class="p-3 text-center text-blue-600 font-bold">+${masuk}</td><td class="p-3 text-center text-amber-600 font-bold">-${keluar}</td><td class="p-3 text-center text-slate-800 font-bold text-lg">${sisa}</td><td class="p-3 text-center text-slate-500">${butuh}</td><td class="p-3 text-center"><span class="px-2 py-1 rounded border text-[10px] uppercase tracking-wider font-bold ${badge}">${ket}</span></td><td class="p-3 text-center whitespace-nowrap">${btnEdit}${btnLihat}</td></tr>`;
        });
    } catch(e) { console.error("Crash on renderStokLogistik:", e); }
}

function renderLogistik(data) {
    const tbody = document.getElementById('tableLogistikBody'); if(!tbody) return; tbody.innerHTML = '';
    let rCheck = (currentUserRole || "").trim().toLowerCase(); let allowEdit = (rCheck === 'administrator' || rCheck === 'logistik' || rCheck === 'petugas seragam');
    (data || []).forEach(m => {
        let dAttr = m.atribut_lengkap || ""; let attrComplete = (dAttr.split(",").length >= listAtributLogistik.length); let isLengkap = (m.status_osis === 'Sudah' && m.status_or === 'Sudah' && attrComplete); 
        let badgeColor = isLengkap ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'; let badgeText = isLengkap ? '<i class="ph-fill ph-check-circle align-middle"></i> Selesai' : 'Belum Selesai';
        let btn = allowEdit ? `<button onclick="bukaModalLogistik('${m.id_pendaftaran}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded shadow text-xs font-bold transition-colors">Distribusi</button>` : `<button onclick="bukaModalLogistik('${m.id_pendaftaran}')" class="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 text-xs font-bold transition-colors shadow-sm"><i class="ph ph-eye text-sm align-middle"></i> View</button>`;
        tbody.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="p-3"><p class="font-bold text-slate-800">${m.nama_lengkap}</p><p class="text-xs text-slate-500">${m.id_pendaftaran}</p></td><td class="p-3 text-xs"><span class="block">Atas: <b>${m.ukuran_atas_osis}</b></span><span class="block">Bawah: <b>${m.ukuran_bawah_osis}</b></span></td><td class="p-3 text-xs"><span class="block">Atas: <b>${m.ukuran_atas_or}</b></span><span class="block">Bawah: <b>${m.ukuran_bawah_or}</b></span></td><td class="p-3 text-center"><span class="px-2 py-1 rounded border text-xs font-bold ${badgeColor}">${badgeText}</span></td><td class="p-3 text-center">${btn}</td></tr>`;
    });
}
let srchLogistik = document.getElementById('searchLogistik');
if(srchLogistik) { srchLogistik.addEventListener('input', (e) => { const k = e.target.value.toLowerCase(); renderLogistik(masterData.filter(m => (m.nama_lengkap||"").toLowerCase().includes(k) || (m.id_pendaftaran||"").toLowerCase().includes(k))); }); }

function bukaModalLogistik(id) {
    const d = masterData.find(m => m.id_pendaftaran === id); if(!d) return; logistikId = id;
    if(document.getElementById('logNama')) document.getElementById('logNama').innerText = d.nama_lengkap; 
    if(document.getElementById('logId')) document.getElementById('logId').innerText = d.id_pendaftaran; 
    if(document.getElementById('szAo')) document.getElementById('szAo').innerText = d.ukuran_atas_osis; 
    if(document.getElementById('szBo')) document.getElementById('szBo').innerText = d.ukuran_bawah_osis; 
    if(document.getElementById('szAr')) document.getElementById('szAr').innerText = d.ukuran_atas_or; 
    if(document.getElementById('szBr')) document.getElementById('szBr').innerText = d.ukuran_bawah_or;
    
    setSelect2Value('stat_osis', d.status_osis || 'Belum'); setSelect2Value('stat_or', d.status_or || 'Belum'); setSelect2Value('diserahkan_kepada', d.diserahkan_kepada === "-" ? "" : d.diserahkan_kepada);
    
    let activeAttrs = (d.atribut_lengkap || "").split(","); document.querySelectorAll('input[name="chk_logistik_attr"]').forEach(chk => { chk.checked = activeAttrs.includes(chk.value); });
    let rCheck = (currentUserRole || "").trim().toLowerCase(); let allowEdit = (rCheck === 'administrator' || rCheck === 'logistik' || rCheck === 'petugas seragam');
    
    if(document.getElementById('stat_osis')) document.getElementById('stat_osis').disabled = !allowEdit; 
    if(document.getElementById('stat_or')) document.getElementById('stat_or').disabled = !allowEdit; 
    if(document.getElementById('diserahkan_kepada')) document.getElementById('diserahkan_kepada').disabled = !allowEdit; 
    document.querySelectorAll('input[name="chk_logistik_attr"]').forEach(chk => { chk.disabled = !allowEdit; });
    
    const btnSubmit = document.getElementById('btnSubmitLogistik'); 
    if(btnSubmit) { if(!allowEdit) btnSubmit.classList.add('hidden'); else btnSubmit.classList.remove('hidden'); }
    
    let modLogistik = document.getElementById('logistikModal');
    if(modLogistik) modLogistik.classList.remove('spa-hidden'); 
    
    initSelect2Global();
}

let formLogistikData = document.getElementById('formLogistik');
if(formLogistikData) {
    formLogistikData.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        showModernLoading('Mencatat Penyerahan...');
        
        const d = masterData.find(m => m.id_pendaftaran === logistikId); const currentUser = JSON.parse(sessionStorage.getItem('spmb_session'));
        let selectedAttr = []; document.querySelectorAll('input[name="chk_logistik_attr"]:checked').forEach(c => selectedAttr.push(c.value));
        const payload = new URLSearchParams(); payload.append('action', 'update_seragam'); payload.append('id_pendaftaran', logistikId); payload.append('ukuran_atas_osis', d ? d.ukuran_atas_osis : "-"); payload.append('ukuran_bawah_osis', d ? d.ukuran_bawah_osis : "-"); payload.append('ukuran_atas_or', d ? d.ukuran_atas_or : "-"); payload.append('ukuran_bawah_or', d ? d.ukuran_bawah_or : "-"); 
        
        let statOsis = document.getElementById('stat_osis') ? document.getElementById('stat_osis').value : "Belum";
        let statOr = document.getElementById('stat_or') ? document.getElementById('stat_or').value : "Belum";
        let dKpd = document.getElementById('diserahkan_kepada') ? document.getElementById('diserahkan_kepada').value : "";
        
        payload.append('status_osis', statOsis); payload.append('status_or', statOr); payload.append('atribut_lengkap', selectedAttr.join(",")); payload.append('diserahkan_kepada', dKpd); payload.append('petugas_seragam', currentUser ? currentUser.nama_lengkap : "Unknown");
        try {
            const res = await fetch(SCRIPT_URL.trim(), { method: 'POST', body: payload }); const r = await res.json();
            if(r.status === 'success') { 
                showModernAlert('success', 'Berhasil!', 'Penyerahan dicatat.'); 
                let modLg = document.getElementById('logistikModal');
                if(modLg) modLg.classList.add('spa-hidden'); 
                loadMasterData(false); 
            } else { showModernAlert('error', 'Gagal', r.message); }
        } catch (err) { showModernAlert('error', 'Error Jaringan', 'Terjadi kesalahan jaringan.'); }
    });
}

// ========================================================
// AMAN: Event Delegation JS murni untuk Lapor Visit
// ========================================================
document.addEventListener('click', function(e) {
    let btn = e.target.closest('.btn-lapor-visit');
    if(btn) {
        e.preventDefault();
        let id = btn.getAttribute('data-id');
        let nama = btn.getAttribute('data-nama');
        let tim = btn.getAttribute('data-tim');
        
        selectedVisitId = id; 
        
        let lblNama = document.getElementById('visitNamaLabel');
        if(lblNama) lblNama.innerText = nama; 
        
        let frmLapor = document.getElementById('formLaporVisit');
        if(frmLapor) {
            frmLapor.dataset.tim = tim;
            frmLapor.reset(); 
        }
        
        const area = document.getElementById('areaSekolahLain'); 
        if(area) area.classList.add('hidden');
        
        let modLapor = document.getElementById('laporVisitModal');
        if(modLapor) modLapor.classList.remove('spa-hidden');
        
        initSelect2Global();
    }
});

function toggleSekolahLain(val) { 
    const area = document.getElementById('areaSekolahLain'); 
    if(!area) return;
    if(val === "Sekolah Lain") area.classList.remove('hidden'); else area.classList.add('hidden'); 
    if (typeof $ !== 'undefined') $('select').trigger('change');
}

function renderVisitAndRiwayat(data) {
    try {
        const tbodyTgt = document.getElementById('tableVisitBody'); 
        const tbodyRwt = document.getElementById('tableRiwayatVisitBody'); 
        const tbodyHsl = document.getElementById('tableHasilVisitBody'); 
        
        if(tbodyTgt) tbodyTgt.innerHTML = ''; 
        if(tbodyRwt) tbodyRwt.innerHTML = '';
        if(tbodyHsl) tbodyHsl.innerHTML = '';
        
        if(!data || !Array.isArray(data)) {
            if(tbodyTgt) tbodyTgt.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">Tidak ada target visitasi.</td></tr>`;
            if(tbodyRwt) tbodyRwt.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-400">Belum ada riwayat.</td></tr>`;
            if(tbodyHsl) tbodyHsl.innerHTML = `<tr><td colspan="11" class="p-8 text-center text-slate-400">Belum ada hasil visitasi.</td></tr>`;
            return;
        }

        const today = new Date(); today.setHours(0,0,0,0);
        let hasTarget = false, hasRiwayat = false, hasHasil = false; let noTgt = 1, noRwt = 1, noHsl = 1; let actBatasWaktu = null; let timStats = {};

        data.forEach((m) => {
            let isExpired = false, isFuture = false;
            if(m.tanggal_mulai) { const tm = new Date(m.tanggal_mulai); tm.setHours(0,0,0,0); if(today < tm) isFuture = true; }
            if(m.batas_waktu) { const bw = new Date(m.batas_waktu); bw.setHours(0,0,0,0); if(today > bw) isExpired = true; if(!isFuture && !isExpired && !actBatasWaktu) actBatasWaktu = m.batas_waktu; }

            let rCheck = (currentUserRole || "").trim().toLowerCase();
            if(rCheck === 'administrator' || rCheck === 'kepala sekolah' || rCheck === 'ketua panitia') {
                let t = m.tim_alokasi || "Tanpa Tim"; if(!timStats[t]) timStats[t] = { total: 0, selesai: 0, belum: 0, listBelum: [] };
                timStats[t].total++;
                if(m.status_visit === 'Sudah') { timStats[t].selesai++; } else { timStats[t].belum++; timStats[t].listBelum.push({ id: m.id_visit, nama: m.nama_lengkap, lp: m.lp, desa: m.desa_kelurahan, sekolah: m.asal_sekolah }); }
            }

            if(isFuture && m.status_visit !== 'Sudah') return;

            let safeNama = (m.nama_lengkap || "").toString().replace(/'/g, "\\'").replace(/"/g, '&quot;');
            let aksiBtn = `<button type="button" class="btn-lapor-visit bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm transition-colors" data-id="${m.id_visit}" data-nama="${safeNama}" data-tim="${m.tim_alokasi}"><i class="ph ph-note-pencil mr-1 align-middle"></i>Lapor</button>`;

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
        
        let rCheck = (currentUserRole || "").trim().toLowerCase();
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
    } catch (e) { console.error("Crash on renderVisitAndRiwayat:", e); }
}

function showDetailVisitTeam(teamName) {
    const list = window.tempTimStats[teamName].listBelum; window.tempDataGlobal["visit_" + teamName] = list; showDetailTable("Sisa Target Visit: " + teamName, "visit_" + teamName);
}

if(document.getElementById('searchVisit')) { document.getElementById('searchVisit').addEventListener('input', (e) => { const k = e.target.value.toLowerCase(); renderVisitAndRiwayat(visitData.filter(m => (m.nama_lengkap||"").toLowerCase().includes(k) || (m.asal_sekolah||"").toLowerCase().includes(k))); }); }
if(document.getElementById('searchRiwayatVisit')) { document.getElementById('searchRiwayatVisit').addEventListener('input', (e) => { const k = e.target.value.toLowerCase(); renderVisitAndRiwayat(visitData.filter(m => (m.nama_lengkap||"").toLowerCase().includes(k) || (m.asal_sekolah||"").toLowerCase().includes(k))); }); }
if(document.getElementById('searchHasilVisit')) { document.getElementById('searchHasilVisit').addEventListener('input', (e) => { const k = e.target.value.toLowerCase(); renderVisitAndRiwayat(visitData.filter(m => (m.nama_lengkap||"").toLowerCase().includes(k) || (m.asal_sekolah||"").toLowerCase().includes(k))); }); }

let fLaporVisit = document.getElementById('formLaporVisit');
if(fLaporVisit) {
    fLaporVisit.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        showModernLoading('Mengirim Laporan...');
        
        const user = JSON.parse(sessionStorage.getItem('spmb_session')); const timAnak = fLaporVisit.dataset.tim;

        const payload = new URLSearchParams(); payload.append('action', 'submit_laporan_visit'); payload.append('id_visit', selectedVisitId); payload.append('petugas', user.nama_lengkap + " (" + user.role + ")"); payload.append('tim_asal', timAnak); 
        
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
                showModernAlert('success', 'Berhasil!', 'Laporan kunjungan dikirim!'); 
                let mLap = document.getElementById('laporVisitModal');
                if(mLap) mLap.classList.add('spa-hidden'); 
                loadVisitData(false); 
                if(hasilVal === "Langsung Mendaftar") loadMasterData(false); 
            } else { showModernAlert('error', 'Gagal', r.message); }
        } catch (err) { showModernAlert('error', 'Error Jaringan', 'Terjadi kesalahan jaringan.'); }
    });
}
