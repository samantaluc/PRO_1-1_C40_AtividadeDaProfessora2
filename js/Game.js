class Game {
  constructor() {
    // Configuração de elementos HTML para reiniciar o jogo e exibir o placar
    this.resetTitle = createElement("h2"); // Título de reinício
    this.resetButton = createButton(""); // Botão de reinício
    this.leadeboardTitle = createElement("h2"); // Título do placar
    this.leader1 = createElement("h2"); // Primeiro jogador no placar
    this.leader2 = createElement("h2"); // Segundo jogador no placar
  }

  // Método para obter o estado do jogo do banco de dados
  getState() {
    var gameStateRef = database.ref("gameState");
    gameStateRef.on("value", function(data) {
      gameState = data.val();
    });
  }

  // Método para atualizar o estado do jogo no banco de dados
  update(state) {
    database.ref("/").update({
      gameState: state
    });
  }

  // Método para iniciar o jogo
  start() {
    // Inicialização de objetos do jogo, como carros, combustível, moedas, obstáculos, etc.
    player = new Player(); // Instância do jogador
    playerCount = player.getCount(); // Obter o número total de jogadores
    form = new Form(); // Instância do formulário de entrada de jogador
    form.display(); // Exibir o formulário

    // Inicialização dos carros dos jogadores
    car1 = createSprite(width / 2 - 50, height - 100);
    car1.addImage("car1", car1_img);
    car1.scale = 0.07;

    car2 = createSprite(width / 2 + 100, height - 100);
    car2.addImage("car2", car2_img);
    car2.scale = 0.07;

    cars = [car1, car2]; // Array de carros

    fuels = new Group(); // Grupo de sprites de combustível
    powerCoins = new Group(); // Grupo de sprites de moedas de poder
    obstacles = new Group(); // Grupo de sprites de obstáculos

    var obstaclesPositions = [
      // Posições iniciais dos obstáculos   
      { x: width / 2 + 250, y: height - 800, image: obstacle2Image },
      { x: width / 2 - 150, y: height - 1300, image: obstacle1Image },
      { x: width / 2 + 250, y: height - 1800, image: obstacle1Image },
      { x: width / 2 - 180, y: height - 2300, image: obstacle2Image },
      { x: width / 2, y: height - 2800, image: obstacle2Image },
      { x: width / 2 - 180, y: height - 3300, image: obstacle1Image },
      { x: width / 2 + 180, y: height - 3300, image: obstacle2Image },
      { x: width / 2 + 250, y: height - 3800, image: obstacle2Image },
      { x: width / 2 - 150, y: height - 4300, image: obstacle1Image },
      { x: width / 2 + 250, y: height - 4800, image: obstacle2Image },
      { x: width / 2, y: height - 5300, image: obstacle1Image },
      { x: width / 2 - 180, y: height - 5500, image: obstacle2Image }
    ];
    // Adicionar sprite de combustível no jogo
    this.addSprites(fuels, 4, fuelImage, 0.02);

    // Adicionar sprite de moeda no jogo
    this.addSprites(powerCoins, 18, powerCoinImage, 0.09);

    // Adicionar sprite de obstáculo no jogo
    this.addSprites(
      obstacles,
      obstaclesPositions.length,
      obstacle1Image,
      0.04,
      obstaclesPositions
    );
  }

  // Método para adicionar sprites a um grupo
  addSprites(spriteGroup, numberOfSprites, spriteImage, scale, positions = []) {
    for (var i = 0; i < numberOfSprites; i++) {
      var x, y;

      if (positions.length > 0) {
        // Usar posições predefinidas se fornecidas
        x = positions[i].x;
        y = positions[i].y;
        spriteImage = positions[i].image;
      } else {
        // Caso contrário, gerar posições aleatórias
        x = random(width / 2 + 150, width / 2 - 150);
        y = random(-height * 4.5, height - 400);
      }

      var sprite = createSprite(x, y);
      sprite.addImage("sprite", spriteImage);

      sprite.scale = scale;
      spriteGroup.add(sprite);
    }
  }

  // Método para lidar com elementos HTML do jogo
  handleElements() {
    form.hide(); // Esconder o formulário de entrada de jogador
    form.titleImg.position(40, 50); // Configurar posição do título do jogo

    // Configurar título de reinício e botão de reinício
    this.resetTitle.html("Reiniciar o Jogo");
    this.resetTitle.class("resetText");
    this.resetTitle.position(width / 2 + 200, 40);

    this.resetButton.class("resetButton");
    this.resetButton.position(width / 2 + 230, 100);

    // Configurar título do placar
    this.leadeboardTitle.html("Placar");
    this.leadeboardTitle.class("resetText");
    this.leadeboardTitle.position(width / 3 - 60, 40);

    // Configurar líderes no placar
    this.leader1.class("leadersText");
    this.leader1.position(width / 3 - 50, 80);

    this.leader2.class("leadersText");
    this.leader2.position(width / 3 - 50, 130);
  }

  // Método principal de jogo
  play() {
    this.handleElements(); // Lidar com elementos HTML
    this.handleResetButton(); // Lidar com o botão de reinício

    Player.getPlayersInfo(); // Obter informações dos jogadores

    if (allPlayers !== undefined) {
      image(track, 0, -height * 5, width, height * 6); // Exibir pista de corrida

      this.showLeaderboard(); // Exibir placar

      var index = 0; // Índice da matriz de carros
      for (var plr in allPlayers) {
        index = index + 1; // Incrementar índice

        var x = allPlayers[plr].positionX;
        var y = height - allPlayers[plr].positionY;

        // Atualizar a posição dos carros dos jogadores
        cars[index - 1].position.x = x;
        cars[index - 1].position.y = y;

        if (index === player.index) {
          stroke(10);
          fill("red");
          ellipse(x, y, 60, 60);

          this.handleFuel(index); // Lidar com coleta de combustível
          this.handlePowerCoins(index); // Lidar com coleta de moedas de poder

          camera.position.y = cars[index - 1].position.y; // Atualizar posição da câmera na direção y
        }
      }

      this.handlePlayerControls(); // Lidar com eventos de teclado

      drawSprites(); // Desenhar sprites na tela
    }
  }

  // Método para lidar com o botão de reinício
  handleResetButton() {
    this.resetButton.mousePressed(() => {
      // Redefinir o banco de dados e recarregar a página
      database.ref("/").set({
        playerCount: 0,
        gameState: 0,
        players: {}
      });
      window.location.reload();
    });
  }

  // Método para exibir o placar do jogo
  showLeaderboard() {
    var leader1, leader2;
    var players = Object.values(allPlayers);

    // Verificar a classificação dos jogadores e exibir no placar
    if (
      (players[0].rank === 0 && players[1].rank === 0) ||
      players[0].rank === 1
    ) {
      leader1 =
        players[0].rank +
        "&emsp;" +
        players[0].name +
        "&emsp;" +
        players[0].score;

      leader2 =
        players[1].rank +
        "&emsp;" +
        players[1].name +
        "&emsp;" +
        players[1].score;
    }

    if (players[1].rank === 1) {
      leader1 =
        players[1].rank +
        "&emsp;" +
        players[1].name +
        "&emsp;" +
        players[1].score;

      leader2 =
        players[0].rank +
        "&emsp;" +
        players[0].name +
        "&emsp;" +
        players[0].score;
    }

    // Exibir os líderes no placar
    this.leader1.html(leader1);
    this.leader2.html(leader2);
  }

  // Método para lidar com controles de jogador
  handlePlayerControls() {
    // Verificar as teclas pressionadas e atualizar a posição do jogador
    if (keyIsDown(UP_ARROW)) {
      player.positionY += 10;
      player.update();
    }

    if (keyIsDown(LEFT_ARROW) && player.positionX > width / 3 - 50) {
      player.positionX -= 5;
      player.update();
    }

    if (keyIsDown(RIGHT_ARROW) && player.positionX < width / 2 + 300) {
      player.positionX += 5;
      player.update();
    }
  }

  // Método para lidar com a coleta de combustível por um jogador
  handleFuel(index) {
    // Verificar se um carro coleta combustível e atualizar o nível de combustível do jogador
    cars[index - 1].overlap(fuels, function(collector, collected) {
      player.fuel = 185;
      collected.remove(); // Remover o sprite coletado
    });
  }

  // Método para lidar com a coleta de moedas de poder por um jogador
  handlePowerCoins(index) {
    cars[index - 1].overlap(powerCoins, function(collector, collected) {
      player.score += 21;
      player.update(); // Atualizar a pontuação do jogador
      collected.remove(); // Remover o sprite coletado
    });
  }
}
