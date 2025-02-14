FROM alpine:latest AS verify
RUN apk add --no-cache curl tar xz

RUN ROOTFS=$(curl -sfOJL -w "al2023-container-2023.6.20250203.1-x86_64.tar.xz" "https://amazon-linux-docker-sources.s3.amazonaws.com/al2023/2023.6.20250203.1/al2023-container-2023.6.20250203.1-x86_64.tar.xz") \
  && echo 'b14c987204c0d240a51aac7c849e5f2056231694f4b10f7fa9d6d25ed19d9cbf  al2023-container-2023.6.20250203.1-x86_64.tar.xz' >> /tmp/al2023-container-2023.6.20250203.1-x86_64.tar.xz.sha256 \
  && cat /tmp/al2023-container-2023.6.20250203.1-x86_64.tar.xz.sha256 \
  && sha256sum -c /tmp/al2023-container-2023.6.20250203.1-x86_64.tar.xz.sha256 \
  && mkdir /rootfs \
  && tar -C /rootfs --extract --file "${ROOTFS}"

FROM scratch AS root
COPY --from=verify /rootfs/ /

CMD ["/bin/bash"]