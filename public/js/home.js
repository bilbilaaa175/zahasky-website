document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    fetchTeams(),
    fetchClients(),
    fetchTimelines()
  ]);
});

// Variable Global Simpan Seluruh Data Tim
let allTeamsData = [];

// 1. Fetch & Render Team
async function fetchTeams() {
  const container = document.getElementById('team-container');
  if (!container) return;

  const { data: teams, error } = await supabaseClient
    .from('teams')
    .select('*')
    .order('id', { ascending: true });

  if (error || !teams || teams.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-400 col-span-full">Belum ada data tim.</p>';
    return;
  }

  allTeamsData = teams;
  renderTeamFilters(teams);
  renderTeamCards(teams);
}

// Render Tombol Filter per Role
function renderTeamFilters(teams) {
  const filterContainer = document.getElementById('team-filter-container');
  if (!filterContainer) return;

  const roles = ['All', ...new Set(teams.map(t => t.role).filter(Boolean))];

  filterContainer.innerHTML = roles.map((role, index) => `
    <button
      type="button"
      data-role="${role}"
      onclick="filterTeamByRole('${role}', this)"
      class="team-filter-btn w-full text-center sm:text-left text-xs font-mono px-4 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
        index === 0 
          ? 'bg-brown/10 text-brown border-brown/30 font-semibold shadow-2xs' 
          : 'bg-gray-50/60 text-ink/70 border-gray-200/80 hover:border-brown/40 hover:text-brown'
      }"
    >
      ${role}
    </button>
  `).join('');
}

// Handler Saat Tombol Filter Diklik
function filterTeamByRole(selectedRole, activeBtn) {
  document.querySelectorAll('.team-filter-btn').forEach(btn => {
    btn.classList.remove('bg-brown/10', 'text-brown', 'border-brown/30', 'font-semibold', 'shadow-2xs');
    btn.classList.add('bg-gray-50/60', 'text-ink/70', 'border-gray-200/80');
  });

  activeBtn.classList.remove('bg-gray-50/60', 'text-ink/70', 'border-gray-200/80');
  activeBtn.classList.add('bg-brown/10', 'text-brown', 'border-brown/30', 'font-semibold', 'shadow-2xs');

  const filteredTeams = selectedRole === 'All' 
    ? allTeamsData 
    : allTeamsData.filter(team => team.role === selectedRole);

  renderTeamCards(filteredTeams);
}

// Render Card Tim (Tampilan Frame Grey Rounded Sesuai Desain)
function renderTeamCards(teams) {
  const container = document.getElementById('team-container');
  if (!container) return;

  if (teams.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-400 col-span-full py-8 text-center">Tidak ada anggota tim di kategori ini.</p>';
    return;
  }

  container.innerHTML = teams.map(member => `
    <div class="border border-gray-200/80 rounded-2xl bg-white p-4 text-center flex flex-col items-center justify-between hover:border-brown/30 hover:shadow-sm transition-all duration-200 group">
      
      <!-- Frame Foto Grey Rounded -->
      <div class="w-full aspect-[4/5] rounded-[24px] bg-[#f2f2f2] overflow-hidden flex items-center justify-center mb-4">
        <img 
          src="${member.image_url || 'https://via.placeholder.com/400x500'}" 
          alt="${member.name}" 
          class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
          onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'"
        />
      </div>

      <!-- Nama & Role -->
      <div class="pb-2">
        <h4 class="font-serif font-bold text-lg text-ink leading-tight">${member.name}</h4>
        <p class="text-xs font-mono text-gray-400 mt-1 uppercase tracking-wider">${member.role}</p>
      </div>

    </div>
  `).join('');
}

// 2. Fetch & Render Clients (Grid 3 Kolom)
async function fetchClients() {
  const container = document.getElementById('client-container');
  if (!container) return;

  const { data: clients, error } = await supabaseClient
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  if (error || !clients || clients.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-400 col-span-full">Belum ada data klien.</p>';
    return;
  }

  container.innerHTML = clients.map(client => `
    <div class="py-2.5 border-b border-brown/10 text-sm text-ink/80 font-medium">
      ${client.name}
    </div>
  `).join('');
}

// 3. Fetch & Render Timeline
async function fetchTimelines() {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  const { data: timelines, error } = await supabaseClient
    .from('timelines')
    .select('*')
    .order('year', { ascending: true });

  if (error || !timelines || timelines.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-400">Belum ada data rekam jejak.</p>';
    return;
  }

  container.innerHTML = timelines.map(item => {
    const details = [item.title, item.description].filter(Boolean);

    return `
      <div class="min-w-[240px] md:min-w-[280px] shrink-0 pr-6 space-y-3">
        <h4 class="font-serif font-bold text-2xl md:text-3xl text-brown tracking-tight">
          ${item.year}
        </h4>

        <div class="relative flex items-center py-1">
          <div class="w-3 h-3 rounded-full bg-brown shrink-0 z-10 shadow-xs"></div>
          <div class="w-full h-[1.5px] bg-brown/25 -ml-1"></div>
        </div>

        <div class="text-xs md:text-sm text-ink/70 space-y-1.5 leading-relaxed pt-1">
          ${details.map(text => `<p class="line-clamp-2">${text}</p>`).join('')}
        </div>
      </div>
    `;
  }).join('');
}