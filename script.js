document.addEventListener('DOMContentLoaded', function() {
    const trackCards = document.querySelectorAll('.track-card');
    const playerTemplate = document.getElementById('player-template');
    let currentPlayer = null;
    let currentTrack = null;

    const tracks = {
        track1: {
            title: 'Thanh Xuân',
            url: 'https://soundcloud.com/qiuty-music/thanh-xuan',
            thumbnail: 'https://i.ibb.co/8KLVbnT/image.png'
        },
        track2: {
            title: '22h03\'',
            url: 'https://soundcloud.com/qiuty-music/22h03',
            thumbnail: 'https://i.ibb.co/sqHndFN/image.png'
        }
    };

    const trackIds = ['track1', 'track2'];
    let currentTrackIndex = 0;
    let lastClickTime = 0;

    trackCards.forEach(card => {
        card.addEventListener('click', function() {
            const trackId = this.dataset.track;
            const existingPlayer = this.nextElementSibling;
            
            if (existingPlayer && existingPlayer.classList.contains('custom-player')) {
                existingPlayer.remove();
                if (currentTrack) {
                    currentTrack.pause();
                }
                if (currentPlayer === existingPlayer) {
                    currentPlayer = null;
                    currentTrack = null;
                    return;
                }
            }
            
            currentTrackIndex = trackIds.indexOf(trackId);
            playTrack(trackId, this);
        });
    });

    function playTrack(trackId, cardElement) {
        const track = tracks[trackId];

        if (currentPlayer) {
            currentPlayer.remove();
        }

        const playerNode = playerTemplate.content.cloneNode(true);
        const player = playerNode.querySelector('.custom-player');
        
        player.querySelector('.player-artwork').src = track.thumbnail;
        player.querySelector('.player-title').textContent = track.title;

        cardElement.insertAdjacentElement('afterend', player);
        player.classList.add('active');

        const iframe = document.createElement('iframe');
        iframe.width = "100%";
        iframe.height = "166";
        iframe.allow = "autoplay";
        iframe.style.display = "none";
        iframe.src = `https://w.soundcloud.com/player/?url=${track.url}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
        player.appendChild(iframe);

        const widget = SC.Widget(iframe);
        currentTrack = widget;

        const playBtn = player.querySelector('.play-btn');
        const previousBtn = player.querySelector('.previous-btn');
        const nextBtn = player.querySelector('.next-btn');
        const progressBar = player.querySelector('.progress-bar');
        const currentTime = player.querySelector('.current-time');
        const duration = player.querySelector('.duration');
        const progressContainer = player.querySelector('.progress-container');
        const volumeSlider = player.querySelector('.volume-slider');
        const volumeProgress = player.querySelector('.volume-progress');
        const volumeIcon = player.querySelector('.volume-icon');

        // Reset progress bar
        progressBar.style.width = '0%';
        volumeProgress.style.height = '100%';

        playBtn.addEventListener('click', () => {
            widget.isPaused(paused => {
                if (paused) {
                    widget.play();
                    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                } else {
                    widget.pause();
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                }
            });
        });

        previousBtn.addEventListener('click', () => {
            const currentTime = new Date().getTime();
            if (currentTime - lastClickTime < 300) {
                if (currentTrackIndex > 0) {
                    currentTrackIndex--;
                    playTrack(trackIds[currentTrackIndex], trackCards[currentTrackIndex]);
                }
            } else {
                widget.seekTo(0);
            }
            lastClickTime = currentTime;
        });

        nextBtn.addEventListener('click', () => {
            if (currentTrackIndex < trackIds.length - 1) {
                currentTrackIndex++;
                playTrack(trackIds[currentTrackIndex], trackCards[currentTrackIndex]);
            }
        });

        volumeIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const sliderContainer = volumeIcon.nextElementSibling;
            sliderContainer.style.display = sliderContainer.style.display === 'none' ? 'block' : 'none';
        });

        volumeSlider.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = volumeSlider.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const height = rect.height;
            const volume = 1 - (clickY / height);
            const normalizedVolume = Math.max(0, Math.min(1, volume));
            
            widget.setVolume(normalizedVolume * 100);
            volumeProgress.style.height = `${normalizedVolume * 100}%`;
            updateVolumeIcon(normalizedVolume);
        });

        function updateVolumeIcon(volume) {
            if (volume === 0) {
                volumeIcon.className = 'fas fa-volume-mute volume-icon';
            } else if (volume < 0.5) {
                volumeIcon.className = 'fas fa-volume-down volume-icon';
            } else {
                volumeIcon.className = 'fas fa-volume-up volume-icon';
            }
        }

        // Close volume slider when clicking outside
        document.addEventListener('click', (e) => {
            const volumeControls = document.querySelectorAll('.volume-slider-container');
            volumeControls.forEach(control => {
                if (!control.contains(e.target) && !e.target.classList.contains('volume-icon')) {
                    control.style.display = 'none';
                }
            });
        });

        widget.bind(SC.Widget.Events.READY, () => {
            widget.getDuration(dur => {
                duration.textContent = formatTime(dur/1000);
            });
            widget.setVolume(100);
        });

        widget.bind(SC.Widget.Events.PLAY_PROGRESS, () => {
            widget.getCurrentSound(sound => {
                widget.getPosition(pos => {
                    widget.getDuration(dur => {
                        const percent = (pos / dur) * 100;
                        progressBar.style.width = `${percent}%`;
                        currentTime.textContent = formatTime(pos/1000);
                    });
                });
            });
        });

        widget.bind(SC.Widget.Events.PLAY, () => {
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        });

        widget.bind(SC.Widget.Events.PAUSE, () => {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        });

        widget.bind(SC.Widget.Events.FINISH, () => {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            progressBar.style.width = '0%';
            currentTime.textContent = '0:00';
            
            // Auto play next track
            if (currentTrackIndex < trackIds.length - 1) {
                currentTrackIndex++;
                playTrack(trackIds[currentTrackIndex], trackCards[currentTrackIndex]);
            }
        });

        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const clickPosition = (e.clientX - rect.left) / rect.width;
            
            widget.getDuration(dur => {
                const seekPosition = dur * clickPosition;
                widget.seekTo(seekPosition);
            });
        });

        currentPlayer = player;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
});