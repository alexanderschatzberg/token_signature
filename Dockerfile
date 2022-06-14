ARG VERSION=stable-slim
FROM debian:${VERSION}

RUN export DEBIAN_FRONTEND=noninteractive && \
    apt update && \
    apt install -y -q --no-install-recommends \
    sudo git \
    npm build-essential git curl ca-certificates apt-transport-https \
    ripgrep
RUN apt clean
RUN rm -rf /var/lib/apt/lists/*

RUN useradd --create-home -s /bin/bash jac
RUN usermod -a -G sudo jac
RUN echo '%jac ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

RUN mkdir -p /usr/local/nvm
ENV NVM_DIR=/usr/local/nvm

ENV NODE_VERSION=v16.15.0

ADD https://raw.githubusercontent.com/creationix/nvm/master/install.sh /usr/local/etc/nvm/install.sh
RUN bash /usr/local/etc/nvm/install.sh && \
        bash -c ". $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm alias default $NODE_VERSION && nvm use default"

ENV NVM_NODE_PATH ${NVM_DIR}/versions/node/${NODE_VERSION}
ENV NODE_PATH ${NVM_NODE_PATH}/lib/node_modules
ENV PATH      ${NVM_NODE_PATH}/bin:$PATH

ARG TYPESCRIPT_VERSION=4.6.4

RUN npm install npm -g
RUN npm install yarn -g
RUN npm install typescript@${TYPESCRIPT_VERSION} -g
RUN npm install eslint -g

ENV TYPESCRIPT_VERSION=${TYPESCRIPT_VERSION}
CMD echo "TypeScript Dev ${TYPESCRIPT_VERSION}"

ARG PROJECT=token_signature
WORKDIR /workspaces/${PROJECT}
RUN chown -R jac.jac .

COPY --chown=jac:jac package.json .
COPY --chown=jac:jac yarn.lock .
RUN yarn install --save-dev

USER jac

COPY --chown=jac:jac . .

RUN yarn prettier:check
RUN yarn eslint
RUN yarn build

CMD yarn start

