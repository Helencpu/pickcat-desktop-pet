/* =========================================================================
 * PICKCAT 网页小桌宠 — content script  (v3 · 重力 + 物理倾斜 + 透明底)
 * 功能：
 *   1. 桌宠浮动，默认在右下角“地面”上待机
 *   2. 鼠标按住 = 拎起来，拖动时按速度向运动方向物理倾斜；松手 = 释放
 *   3. 重力：放下后加速下落，触地反弹几次后稳稳落地（带落地小压扁）
 *   4. 单击 = 压扁动效 + 小黄鸭吱吱声
 * 声音用 Web Audio 实时合成，无需任何音频文件。
 * ========================================================================= */
(function () {
  'use strict';

  if (window.__PICKPET_INJECTED__) return;
  window.__PICKPET_INJECTED__ = true;

  var PET_SIZE = 72;       // 桌宠显示尺寸（px）
  var GRAVITY = 2400;      // 重力加速度 px/s^2
  var BOUNCE = 0.52;       // 落地反弹系数（0~1，越小弹得越低）
  var FLOOR_GAP = 16;      // 落地后离视口底部的间距（px）
  var CLICK_TOLERANCE = 6; // 位移小于该值视为“点击”而非“拖动”

  // 拖拽物理倾斜参数
  var TILT_K = 0.055;      // 倾斜速度系数（度 / px/s）
  var MAX_TILT = 26;       // 最大倾斜角（度）

  // 图片：优先插件包内 pet.png，加载失败自动回退到内嵌 base64（双保险）
  var DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAygklEQVR4nO19CWxcSXreV+/qm91NNineokTqHImiRhqNZudY7+yuxzvj9c4G8MLrtWEESQwkhmMHNpwgyDFALmSDAEGMBew1HCTIbmJ47Wh2HY8xtrPH7NpzakRJ1q0RKUpDUaRINslmH6/fexX89V49vm52k908NJo1P4DoZh+v69X/1X9V1V/ADnawgx3sYAc72MEOdrCDHexgBzvYwQ52sIMd7GAHO9jBDnawgx3sYAc72MEOfqzAPuoG7MDFK4ByamhIV6NRjf5/88KFwiuAgx8HAsibe+fmzfIrAIf797cerw0NhUrxeJeiOwcBHGAcAww8Qh3Dwe5whrPM0d/7mbNnH3zsCEA3Z6aiAww4zoBBAFEAecb4JLg6Ztvs+ui5c1MPg+WPEl4BlJHjxzuZZg8zjhcYw2lwDAFIgLGQ/0HObQDzHHiDKewbRpH/+QsXLix/LAjw6vHj3apqfwUMfwccjwEwAJBqswCYHMhawE0NeNNhzp9GSsr57bi5R07wJ4f3MYafUjheAPAEgDQYU9f7Luf8DoDfBdd/d6u1wZYT4MzIyICm2f8MYD/vsXr1h7hvAUqcY4Ix/l1A/QM1m3vzxZs3S/gxE/yxkZF+RXe+oAA/JwYEY4nqz/GVPvHBgn3H+RIHftu2lP/0xdHR7CNJgDMjIylVc/41A/6eL3zOhcGXP+Q/997zYHOOW2D4lsP5H4yevXjpx8E0vEqaULNeANgvg+N4hYoPCF1VFBiGgWgkgpBhwLEdLOSWUCwW3X5a+QKN/q+q2fx/3aqBwraS6SeeOPpL4OyrYCwjXw+HQkgnkwhHY7BME8v5ZeQLBRRLJdEBPsvdziiB4RzAv26V1TNbyfSHideGhkJ2Kv4Uh/OrDPhs9YiX9019096WQaazHbF0O6LRMBRFh+OUkctmceeDW/jw3iScgHYgc8AU9muff+f8q1vhTG8ZAV49OXxAZfjv4DgtR3c8FsO+g/vR3tMHQzdg2RymWcRiNovFBzOYmppCLpeD7TjV6u4BB77hAL/z8nsXrn+coobvnDiRYaz8dznHP2AK21cteBrt8XgcnZ2d6OgfQDyegGaIyG8V8rkcxq5cwe3b4xUkAOd/ZlnKP/ri6Oj4I0EAYryViv4mA/6lVHOapuHAYwfRN7Afmrr6Z4gMudwSpifGMfnhh8jl85Uf4JxU3HcB5atn3xt941E3Ca+Qk3fqyOOqo/xjAC8HR70c8S2JBDp3d6OnewCxeBxQ1/X/BAmunH0P96anV17kfAnAv9kKU7AlBHj11JGTzFH+mwIclTarr7sHh048Lkb+WiAiLM7NCHV3b/o+yuVyhTZwOL8I4N+HTfzJoxopvEYqvzX2Ijj/LXA8EfTsSfiRcBhdXd3oGRxCKtnSkOCDmJu6hwtnzyK3vOz7BNQvnPOvvHz2IvXPhqFgC25ecZQvKsB+2bh4NIq+wb3rCp9A2qG1vUOQhTRGsqWlsoGMHWXAV4sh/P3Xh4djeBSFn478PLf5fwQYmT9VCl5hDJ2Zdhx5/AQOHDuOVGu6pvAt04JZLIjRTn/0HDalAVxQ/3Tv7YOirIiL+lth7Gfo9zfT/trGpwlQskdleB4coiF00+0duxBPpZq6DpGFzEWyJY2xa9dwf2bGt3uMsT7G+b8oGYifGRn52qPiHJ4ZGUmVdeeXGMdvMIX1VY/6/v5+9OzZi1gyWfP7JHgyg9nlHIpmGZZ3v4aqIBGJoC2VhBGOCNL09g3iwd37mJ2fdzUkYyEG/tNmKvpHAK59VARgKuOfAGcU24obN0IhdPX1NjT662mDUCSK8PXruHP3DiyLckeCBRnG+a+rmoNHgQRn3JD3VxjHrwejHnJ+SYsN7ht0nV9FXRnN3ugPCn6hWIITGO2EsgUsm2WUymV0t2cECaLxOLp29yK7sLDiEHI8Jvof2LCjvCkTcGZkJAnOPiVifi9xQWFNcPSbZRPZhUX/j0JAsvtrgRykPYcOYe+ePcKZ9EEkAIgEv/JRmoMzUvioFD5pv65du3BkZAQ9fQOu8AkkYPozTaHi796/h9uzs5jPF1zhMwY9Hke4u0v8KYYhiETvT848EIQhdOzqERGEnzQiR5OzTwk5fBQagBnWkOMoI5JFJCyKaeXoJ+HTDeRKJsoey3VVRTxkIBWLi7h3laagz3EbUUXB3t0D4qWJiQmRN/AgSFAMIffa0NDvPOzM4evDw7Giq/ZXhM85NF1HX28fBvbvRywi5nMqYDo28vkipubnUSCtRkJkDEamDS1HDyF8YAhG2h04S+f/BnPf+xHsQlFoiFRuSfgPNDDa2jJYXKIgwIUDjDDVJvOTfegEUDk7CmBAqn/KZFFCg0CjfDa7IFgs4LG2bFmYt21xY8nlkCBCKu4NZpr/sDm4w8VzVVN9EtwaG3PNgZtjyJDdLaei918B/vBhhYiv0QRXiH+JcfYbwZFPwidtRW3V6gif+mJ6KQfHcURfqJEwEsOPoeXJxxHr64Oi6/7n9eeS4IUi5t54U2iI6YWsO1jCEbR1deHevUl/QChAl8MYzbdcfKgEoJFgcv6kN8sn4slkokU0lFAqLGM2tyxullRafN9e8Xph8h7K2UVxY0QO0g4Fs4RkPI4ICdeptIf1SMA47+PAPx954sgE3v2bv15rfj2vKLqqqprjOELdcM4r1A5jzKRHRVHEY6hcLtj5vFU1fc3K6einwPFPFLbi8FE2b7CvH327B0RbQe0LmK28aWJ6fn7F1lMGsLsL6U+eRvzoYzCiMXdwBBI9WjiMltMnkR+bQH58QvgDRKCuzghaM20isxrIC6QZ8OTrw8MbCpM3TIC8orRzOPt1L+yhEKWlPe2r9MVCwVf7JPyOn/0C1HAYhclJ5C9ewcLoRUEE0ghTC4vC4dkVCYsOrUY9EiicH+Zc+Y1XTxxdAgmROW0qU3eBOynOWbcFZGygTYUTY3AijoqwzrB6iAIocxRU2EUOFEwDyzAi+cdPDs9+m2EaHPcVJubpfxlMaD0BauvBPQPo7O13hS+UmKvema77whdakAYCmb+D+5D69LNIDOwGyEeoMQlEr0XaM4gd3o/i5BQc08RSoYB20xJaINGRDkZJqgUcsxWFVO/DI4CmYYBDzGOLBpP3TyGctP3UYKnqYsOHEGlrE+8Z+/aJmyebt/jDt5C7esPXBqZlodPmSHhaJAjq4L7eXhSW8yv5cUZBCH+JMTflyriSAidBUYjkTUHTZ7xrrCjZ1dC9D62koISWsRl3p7DBReiVWEv4Phwb2ZwpVDeNXqkFW44fRevzzyLSQbKqmAxbBaZqiB3aj6XRSyhO3oNpOyJyoERSJt2BCWPcNwMaMMQ00AgZf1hRAAOz9zBAeC10G2T/I6T6bNfZoQYT9HQaEWI7fY7sH/2obiD92GGhFVqfe0qQhDqDOmsyl8NSvljzR6nT9w70Y1d7u/C43ZawECWLRMKIVDPZZhIUpaQZU8k32cifAGk39zokeF/4lOg6uH9fbeGTE+c5e1L4dH+tT59C6oVPQU8mYZVMOMIRpP6oTQJqQ6i9HeG+bqHtSJuSqaT+pTCZ+ls6kgzocJhzjMweHoYGeG1oyLA4G2bS/jOGWDQGXdWEDaSGSvVPNxD1vNuKG3QchNNppD/7E+L/+bfeE14vechEgm7q8bBBtgXwiEOItySxf2gQJdPEXDbrE4Gcq+BUM71OKlfzYm/5SK/Vg2PbsLx206OMz0nbyCwcdfzQ4F507uqqMfIdLBVN0X7p6VN4l3ruNBLHjgjiO44NRVHFtelPtkdRFYAF5EeRRTiMyN5+LJ676JuBNsdGLGwgmUqL+/cQUjg/dGxkpAVN5kc2RAArmUwA5X6Z9qTOjsSiUA1DePBkz92bUqG3pYGQq9KZovhagGwlzXtruiEcntokiLskEBfziOA4iEdiOLJ3D27c/RDzCwvibTmXTtPOUU2DHgmJOXZN16ArKrjm+hZ6jYkpQtnLTVgUiZRLsMoWytyBaVvILyyjmF+Gpuno6tqFTEsSTKm6juNgvlDA9HJhRfjpJFJPPYHoiWPgqgqb/AOb8kEaGAlcfG2FENVkoIEV6u6C1pKA+WBWaNVyyYQRiSCajImw2/L6Gowdg6uRt58ADiu3qUwMUq/BKmIJ8mYBu2wKW+6qvghC/b3ud0R8T96uIwQvXxMdEI0i/vjwCgmKJdGJU/llITDhGJLwbQfcixLiyRT2h8NYLBYQMQxEIq4GEqNSIc3tCaiWwIm3YsndCiJrJKd4D4dtigABqsLAy2XxR46eICap/aK5Svjx559B7LFDUDTNJz5BEsEfFMypSQYigpZKIbyrXRCAVs2UCnmRZyB/i7SaIIAbhvdoG/ADNkQAFUoX506P6GPOESYBGAaY46BsW779Z+EQtFjUH+3iJqVadWxw23E7gz6biCN69BDM6QdYvOymtguWLTo0LLxlp2LZFFNUYQ7iqVYwTQE0A04sBBbOA3H3tniblyCLrjH7ll8hAivMAXkVyFnidW4CrAQwG9C86IQ0HJNEDIR8+bLpCl9ciAknTiuUYE0/cBM8odqpcSKGLdMYFCUqChSmuGSwVai6DqMjA1xmwswtli20ks73/ACxasg1fSnyywD8oJm08MY0AJxOJeAAkqqNGG4HUScQU8XF4zHh/VpmWdyQ+LztwCFheiOCbpgcIuqo3LmLIk/g/47jwLRscC0gJGKdpoFRuElC2c1cQbdGgDbD7crYWv7+GuARMOseUFaBkgJGa3LHVOADcr68iSnSAEYIzCy5JCBNoKiI6gYi2goJzNk5zP7lG0J90wimSIjUORE9aArrEiJABr2zHWo4JMwjaVdKLOkhQ/hdc/Pz8qtRztkQ+WfNZEebJgB5mgpAiRCf0mR7oWrgjIs1XSLbRRePRWGTShadtfqG6bXy1LQQfP6DcVjzWT9ZQogZuujYoOCh6WBh16dw2pPA6dTGBV4FzmJgSgLQl9y4ME7tsMHvUoS9snzNJ4FdFlqAiBAnmxiPY84s+alvp1x2bffsHJZvjSO0qwPRPf0iBFbb28TorkcE0R7HgaMAajIJRRLA8wNiui78LnJOAyFxXykep3zF9hHgqeHhSAnoJnGIzqDMlowAaGlXQA0q8Zh4v9ZN2nPzIiG0ePGK6CAZ0tAfhZOpkIGkriKkMjHCaLQLm0tkk8gXwWZN8C0gAOPLYE4OcFby7Mi5GoCVvBR08PNEAub+Lt0zmSciQSRkoGCEhElYLJeFGaMBQcKjrF7xzofQLl5BdHAA2qEhtHR1gdcxDwTqOxpIFD6W5xd8PyCqxBANh4SvIEJK0RDsa9YRbJoAIq0KpyIC0HUNKufko6HoqX9iJkUApMaCKBUKKNy8hcKb78O8P+2PeLqRiKaiRdc9wWuu4MkjplFfLXz6jaIF53xeqP6NaAEmhU4ICp5wxwEucmDSrP99IoVugCsKWNnVBGLNH4WwWhjJcEiYBLLbvlawbV8r6JeuwdzdC/XgIJIDu4V5qAUejQgSBM0iQUQ55Ah6BOAO2phhZZpxBJsmAGMsyoCIHLEkuKhKNs0GBSQyAmCGDo2ixYCdz03cgfnueaEOaUR4F6wa8QHBq3pluEVkqYrjlbkc+A0GPrIyJS8uy1dnRX1hSzhVQifQTVx3wM/TpHzVYtV6fULmjyIPyzMJXjKJvKKwriOlaShFwmI+IKgVyrkcypeuQr01jtKuDpH6jQztgdrqDhzfT6JZw44MlKuq+J4YZI6DSMgNdQvFovgMY0gzrlR2xJY7gaqdAEM66GeyaMTtKIucPU8DqBrKIQMREv7CInLvX1il7mlqOBMOrQhe2nkaUWRSgiBiBSdaAkRg55eEp88GzbWFux4WAJxnwAf0W40J328DmTrNDQulNiDIyIXIQHMdQa0gJoiC5mFyCuHL11cRQfxRtpTu2YuibIdDC4X9BJeHkALe5eXD+PYQQHESjqPE/DUAlOzxMlhlqP6yJgoBw+EIFm+NiVGfu3FLZLOk1qCOaDVCiNNXib006nWtMoavBWnv5KMHdrbgkqNvg9ntO1LluyO4GeH7baDvBLVBIG9BCGoF0np0/xVOIy0Y8YhgjF5C/MCgCI2JCKRNZfJIaFmR1NKEAx5oKUUC3a8AzJvF3HoCqI4W53DcEJAmgSgE9GJkkUULQHr3wVFPN94RiyChKCKpUmHnN9DpEnzeAXubOqZJEuQ4cJWDX19R+ZtpR4VvoFLOwCVCMI+xQgQNUUNH3igLItC6QNIORAQxAXR/GrlrHyAxQtP9tUEOuO+gkl/GeYYcdTQ4Ndw0ARzmhBUO0vmCeVUqyM0BMCZCusX3RleWPGmaWAm0y9Aq1f0mBV+hgpshAdn6qZVRL/yWLWhHRZvIf1EMcI1sti1MQwURKNlDDqNHBEqikVnI0hoJIoJt+0RQW+LgNLkUaCMNIHLAyRH3F9ACbeSoN9rG5k0AF2GGGPJ0I6SGKCdNz6V3SpC5AGowxfOZSBgpVXWjAs/Or6vut4sEMxy4ooDf3bpR36hpWIsIYRoosZgwj9VEcOYXfOEb0g+iSGu1os+Qo95oKNg0AcTCCJob925M5Ks9H8DQVKjERvlZRRE3s12jvhbEdbMcqEUCcvJuOELds7y7Cmc7Bd80EWjW0XZT37WIQCDHuYXCbtIujiMmvapyAWnhqDcIrdksoAPWEhxXEX1lBQ/ZdfLqqcEECu3aDF3Exn6ih0DzAFs8+qtBmgA/tMCOaUAHA6Zp1FsABQeW4zqe7KOpkLOKCN5ElySDrxGqiEDhHwm/hWZXvc8zcpwDcDhi5Kg32pbmNQAXKWCRkSHbwwMNIEGTwCmsI4ToBlccFJfpcusXU8C9WJ8M15bbX7oejfJ3LPCQO6nDvdDuoxJ8PSKA5roCfoIfQgZMQzgS9qMTmlwTax/IZDClIhnEOMKKo9XOKG2WALTI0gKMYPcZNO1b4ZgoNFu45nUEEShioBsW6/s8MsisobeefksERZM4y97KmY9Q8HxlM0fgRc9nqkqVCyFXbgmv+bwmGMLkqG/nbGC04gKUot1M+BYgA0FqB/GeF/cKSHJQBtpXKo397nYLngeFW0eoQmX7X3AaF+g6CNPKoersKGM1F75uJQH87+k0F18HJW+un0yBSG02cLM+IQhVS8R9QUqCyDdqEcX/Up21AFU5iw1BClkK1xPsZoXaDCyjMuKjNL3jkNHbBgLQUjCG8gGxJmSt9XWc495iFufuf4D5wiJ26W3Y19mNzmQaYU3fcAetjLQq4VURpdlRzx+iwKR6p6IYFndEBCWc5GbgOdQiDFdo5VC1BnBLzW05AZhqPQtH7H8XDiCpHq1G45fNkhD++/duYKFEhR/G8NZMFI9l9uBoRz/6Wjs2RYRHTaiNCp4Wms7nljC+dB93snPi9b5UKw5l+hHz1k02eDH/aXk1+RMUqW05AajgEXfsX2BAhhhIyi4ZTyBWYxs4NYpGfp4WV3oNnC0s4Y07FzA6fRMjHUN4vGsQvak2QaJHTVhbPdqXS0XcW5zDxekJTCxO4f5yVvQRjd6JxRQiqoHHdu3ekC9FK7FojWBgv2CIytCdGRn5diMlZLRG439R7Yqz56TqSUSj2D1Qm7nUqJ74Loxl76NgVc6nL5byggg35u/gVNdhjHQPIB0N7Hj9MQDzFsHMF5Zxc+5DXJgaw+3FGXHv1VgyC1gq5kUKPRhNNQpKsO3p6sRSLrdSQYTzZzTN+dnXhobWLSHTEAGozl2ZO7+oexsiyWZ19/QgHU/UbdQTvYOIh3Vx8zfn760iwr3cPP70g7dwK3sXz/UfxVCma1PRxKOE+XwOV+/fxvmZMdxemFl170G0R1vQ1dLevB8QQCrdit3dPbg27m+bSzic/6LdGv4egPc2RQCxBpCKHHKc9H8wmURXe2bNRpNmONmzX9i38fkpjN6/hetzkxWjgMzDxZnbeFBYxPPmMRzvGtpUR3zUWC4VceXBBM5O3lhT8BHNwK5YCv0tnb4p3DBIc9o2OtNJPJhP4f6sW0hUAQ5zR/nK68PDV9baNKo1Mvpt7nxB8fbF0cRPV6YdMW8V8HogIhzp2oOBdKcgwtsfXlulEUgb/Mn1d5ArlvHUwAGhQT5OsB0HY7NTeHvyKi7NTNQUvKaoSIai2JPahQOZXgwkdgkNuiHCe0J3f9zdbxHSdPTtancLTNKeQZoadvhLpqF8G8D3611KW2/0a7r9Kbh1AMQPtcTjyNA69SbDLCLCY50Dggjv3v0AP7p7QTiGEqQZ/nzsXfH840SCbGEZo5PjeOfeZUHkWoInNX+kYw/2p7vR1dIq+qI627cu5GdltZEa303H4xVbxxnDXg7nC68PD79bTwus2ctU1Zpz+6eZZ/tpdk+M/mZClirQd5/dcwi9LWn8v/FzuDk/5UcKNHI2TILqDvFSvyu5gxqdzTbhc3CO2/MP8KM7F2uO+qDgj+8aREciWRHxNCz8BgQvoWs6ejJtYrtcUAsUws436/kCa/YwlTQXde+8BscTCTH6m2ZvFUjtDbV3I2ZE8N3xcxi9P1ZBgu9NnENYZXii/+DaKnJlF6/YK8DbW8EzGXCqxReuMlHFEtjCItiDB1AW8+CFPLi33UteoxmVf3V6An85NorxhUABRw9tkQQe79q3SvBNj/gqNd/Id2pogX7FUV54bWjoYq2IQFuz+ifVs4e7B5AEkWlJIUxLnbYoZOtOteKl/VRkBBUkEKHi3UvIxFKCKLVuVNwcbUbdlYHT3wdnoB+sPSO2YHGx4KQqS0l7Ei0barEIeykHLCxA+WBcEILNzIF7W6zWIwKlt8/duY6/vH2+woRJ524o3SWimmCyq6nR3qzQq0ALdHa1poNaIGRx/mk7HictMN4wAbz6f3SYgSoLQHS0JaF6O3TFCtUtmIyhHEAtEpA9fWPiIjLxJFKRWKXgozE4BwZhDw4AvT3gtGaedgDLi1aVXHG/pEDRFXCavEokgO4u2Af2gS3nwWceQBmfgHblJnh23l2OXaPNUvh/Nvb+qpieRv0zvcMiryHbu67gg+o9+LjJAdaWSIgknSwgoQNHHc053RQBvPp/Q7IjRNaPbL8s1CQ+5I0yuWUqkOcmUK6b4lKZrpRbrmthZNdefLg0W+FIUbRA8fTp3YcqBG8dPgDW2y22Z9VEsBS9fB5ckCKhqOBEhkRCaBDz2FEol69Cu3QdfPZBBRHoni5O3aop/IFkBz6zZwQHO/rXz2wGR/kmRvpaMFQNqXgcM3OzcttYRuHOT9SqI6StUwAqLUugZdJpEWr4N0FECGzUsBUFd7OzGJufxnxxCXkrj5JVFpkuQolWx5Jm8WYIa4FSx0GQP/DBwhSOO/sROrQP1tEjwOAewAjBLpehELGqVT39VjaLe2fPiuddp04hREKu1go1yIC2VjjPPAXz8EGXCBeuwJmbFW9TmPfdsfMVwidHbyjdiZ8aPCVieTKT1UvK3dnNKtUu+3CbQL/flmrBhzORlSLcjB0rGOitripakwD0QZUKDnCo1Eza/p2M1ZhgkkSgDlqaE179epmvZrEcj6L49JPQnnzCHa302p07+PCtt2C0tqL7qdNupS0PtCHzxh9+C9f+6I/F/4d/4Ss48OWfc8uwVXX60q1bmL50CZl9+5HcP+SSgIQniHAa5cE9UN4/j+KlayKPP5NfrNnGSw9ui7+oGhHZT8rth1QDuqpDdyBqHpJmoHV8RBr6W5naXrtW0EYRC9EcQXSFABxDqsION0QA8UGHD/nlXyJRccF6oOXM4zMzooNqzE5tGC2hKA7/5OcR+eSzru0mODYmvvd9XP7GN6GHwzBo3uG5Z9175BxTb72NW//3T1HwKofc+KM/RmuyFe0v/qSoYCI/RyQ69/Xfw8z759D++HGc+K3fRKw1kJGjVUrdXXAyrVhqb8XM1Td8/0SC/r86+6H4I6ESdPmoupVJSB2HVF04hLqiIR1OIsEiiEd1JMJRpLWYIAjVV6BrbFUmVK82A0CaO/zka0NDrwWjAa2m9+/wk8wrikTTvnQheYO1QHvY6YboZuthre/7jfY+E9VD6OjdI4Q//LkvVBRRpBFjF4soLS0JIV/91rfEy2oijoUbN3Dt//wBcjMzfk2fxfv38fbv/x72LcwhuYfqJwC5qXu4+8MfYebceZTNEqx8fmW9XdVoJD8jcugAkv0D0D64tIoEEvL1YDi7Xl/Qfcb0kCBIJtqCdKQFu1syGIq3rZjbjYIxJGIRsXFH5gQY58fNRIJYPum3pc6iD/d8G2/nD11oLU+eWHsk3Y2izcXkTtmxEDciiGpRhHQNhqVDC2kithcLRddAqGcIxjNPIHn4EJKZ9krhe5VBUsNHhV0nAky9+x7mr7pazSoUhUBJ+KrsQKssSHDh934fWiQsPkOgzxF0I4TeZ59BPE3uTm1VHEkk8OTnfhYLE+MYH7u6aRMXDHelT0H5BJk8+mz/MIYzfZvTBlS5VWhIjwDuS0PQy91rEsCB2cXAehXvsCdxmJFXkGEtxENhPN25G092uDWB6GZIM5AGqUmeyrOC3P0Ch/fBfuZpoMeN/esJJJFKC/Uv1bx8JJDw2yItGOztF/9/cHcCs4VFIXApdPk5x3EQ7W1D14kT7g7fwGaWyrYq6D5xAi/+03+L8XNvQ70zg4nlKUEILbsgCF+0ysLRJSdXmkEyjX4E1IBppM9ki8sYX5rHwXQnIsqmjgJASNMq1grQ7mEVal8wK7iKAKqqDMHhXXLrF12ANiM0AmH3Gk3fBlKitPefnzwO55NPu45ePafIC+WWZ2ZQ9hI3NNLbdNdBpbJqmXgCvYk+xAzXMUzvyeDu0h0xSeLV0xJ4sDQPhyqXLNOmzHLN3wmCNFHXocPoPHBAJJSOlU0YU9Owvvc+7PHLKC8vi9I3VGo0z4kMJkyzhJJjI5cvY4kXKiIj+qOohwgiyUGDhswCac2tAF2vJRLF/ZWtYwnu8MOvAN+W9ZW1VRs/OO9XAvafNn74RRm3GEL44TCcp58Ef+Z0/bi+aln0wtiY8AEIfakMDnQc8HYmGdCrtsUREQ60HUQ5vSJk0zJxzhzFFGkFygwGNEjFb1bdt9BIXkLJ0HWwwb3QqZ7/aBfib70HJ5uVhzlUtJu+RwIggpCwC1TzjwE5c1ksBrm3vOiTozPRhpHW3QhrzZ+3UA1qSyS4c4gOmeBOX3DzqLaq/AsXpcZos58obxahfenbJfxIxB31T56oLfwamoDCvNzUlFDfpMYT8bg/2tdCBTE017QRyCdYzC2htU7NXoE6A0AQIpEAJwJnWqH/4C04d++sajcJglb70H4J0pA0qFrpmlE3rBULRKnAhm0LbbtpBzCAMBXqCGwcAVh/SRcqUxCgwsvw3iDjKXQ+fTHiHWm2lUu2gsK3Tj/hCr/6+nVm7yyqQ3z3rq/+g1vTGgWRge5N8Zwsc25uvQavHatTRvHQQZR/5gVgaM/KLqj1rumBnD0SOvlRWyl899wi91BKHwxpqvPoNz34Bdu24yxQAFKs+tVoRtFVYVuq9j9xSoz8igSN7Og1fosmcqzslP//RjWU7BTbKrvlahqcbVvz7e4uWJ9/ETh60PVrHoF1jkKG5MP5O5HRFtw7WEEAptoJsbkwUP+PGLRVkA5fhc1vopNIlVLxhBLtqqWbo/LyVsPb4CoQdFbN7ELFbp1Noa0V9udeEE7tR00CGrSihkDQMWcIU5EP+W+ldBWeoM2FwZeqtx1tSviUKz95fEPCl7Bo9m7ZKxdrbdw5pdlNv+rW/LxfyXRdNKClKJIRvs0jQIKV2sPehB0V+FJ4ehUBKAJgUFqIId4H3dq71UWRNwjhHR896HbMBoVPKBYLfggoqmdt0FumXbWqZ28LhXxFgcqGsR4JfvJTcJ77hLtY5SGTwI08vIKdVX6Ft3WMVRCAdv7SpkLBEIJX/GGrGkPOkfXp59eO8xuAFD6h4kSxjTcOlAqm2cWNfr/uW0ZIaDsyeeT0PmwSiDL3VGrWS8h5CNHWMSokRf9o1cwIijzIHGLTetu+a0GsD2hvB557WtjHzc58KZ79rwdW4wAHHihdI6FXf87exCTWGuGi0HZEAmr7X78DXig8lG3qjTrtFQRQFFaiEhMSFpU6C6DZ8mky3FOePiUWXGzFtKdTI0tGQucZhmi6FZytPkKP8QWoZgkLpgn1npfH347D5jh/ZEgg1f968HuTTsg6/sRwgQH0V+OCbijY6PYl3+kbOQp+7Ej9A5KaBM0B+G2ixEl3BOHWPVBSLVDrnlbqFs9MlE1R5trJLoJf8udDXGyRs9sQCf7qbbEGcbtIIDOPjSDoBHKFK0VwUMvEjZBnTBUpP0qnrxpUfFKSIB/VofUOinRsfeGvgD5DfyJ92+ZVVKVdztGoqNy9Zahzr9In4MeH3drH24TgxBNpAlqGFyBECUzJyrmAoFHnNrdnOYPvZdFsljxDR1640SIPSnsG1skTm3b6qkFFk8OpkO8QFvJV9X8bxELZEkkgQrK7x91jv5VO2hokoEFBM5/bsReS0srVoz9oyulYPIfzQs08ALfVJRt44CdITHOVLVlvWlNm+qxPnAK2yO4Hr01HqGipTrcthSKWKInTJOhYm9mZ2yIHQOsBIl27xLzHlqMeCRIJMe2t9PRueYq9Wj6kwemArZVsK4qcOb6Mq936rAb4y3Jp9FP50iCcwKrfuqr/wF7wg/trLtjcFGgPXCyKtqF9Io9P8/v3PxwTAm0G2ewU5mbdOoqUTUzu27eqrP1Wtrnmy91dKH/yNJRUaktIUEv4UoZCi/uHXWAWjuJvaKi461AuR6rhKji36QukARaX8v4RcP5FHbsmCcToT7dui+qXoIUb7cdH3JW+dJLorStCoI2CyHLz0qhYNkZIHzyA1MDAR5Kts4cGYZ84tulsoRR+LcfPpFNLAjugOMekwvXZmgSgxYKM8ZvkX9H/dMHlIp3oWXarWQfMgSRB5UFOCuzjR+D09W7bsmf6vbajR8RCTgKtCzj75l9gdmZi3e/ml+dw4ez3cf3SOaH+I8kkdn/2Mwglk9u6TLte+pgmwpxjR4EB/yjipiGnkut5/UvLhRU/jgY2MKEtLPgaYJXhsxm/qDhsitYU0v/LhbxvBiirJJc303P6YXFAozdhxDp7hOqvtQR7S81AKoWhl15C9vIVsd5vcmwMi7kz2LfvCHoH9iESjSNkuPMdJTMnHMV79+9i8tYV3L9zV5gOsv39n/k0ep99dtuWZtdrv4B0AGny6MmT0O4/gLO42HBoKEO9tXwyGrCLhXxgLQDyjPELL968adYlgGKHxsHKF8H5Pmpk0TRRKJTEwgK6oGk5vsAlGehgJbGk+cg+8M6O7e9MztF5+kkc/MWv4Or//KYgAf2dm5nB5YvvIRVtgRr1pnvzJpYdE4X5bMVC0L2f+TQOf/nnBJkemvCr7sEnweAeOI8dBHv7vbVTy957cnVRrVFPr8vQfTGfF6Vj/PeAcc44HTPP6xLg/bNn506cHH4LwEvkFhB7srmcWBlMawPkjxCCZLCTLQiT1/+QQFpm6OWXxeaQW9/+jr/EmxaIBheJBkGCp0WgQ597Gf0//aK7D+ARmLOnk1Wdx4+B3xwDm56uWA28ntClLKTQxZG33muziznk6RBvDwowapkamXjUJQAlCF5lzl8pjjLB4GoBWlBJewOCJKhuQLl1l7tJM5cTHS1PvvSxhesKBLwlawPPP4/2/fvFTqGps+9j4fZ1mLOVtRCMthhi7b3oOnkS3adOITG4d3vNVJNaQKjz9gx0mjC7P7VqaloKPeiDBQVe/R6BzPbC0uIKYTh/AMa/98XR0YrRUTP4jZSU86bBvwuwvZRAo3XlMwtZsUdQp2PMaKtTgAikBdihPnFGINX+LVmWf9aNeE9VxJGoFWfjBrFJcsT6+rC/txcDL72I8uwccrOz7hZwb8NItKVFaIpQS2Jl+fdHLfwqEgiHcHAAzuhFOEuVGqxa2I3k+mn05wLqH8C7VlmlolF8XQLQDtJvPzH8KuN4kQ4jpAYu5nLipMq2ljgs8jzNFSKY0TiQiIsS4v4OG4oQKCtFFwykEoLEEP8HyEAkEY+BvHzNKelqwnjCpD2CoVgc8f7Vpkhu0lzroMZtRUBg1Wcn+yeqtqZhJTvAvA2p/uebXK00v5DDzOyD4OhfAuPfOj86uipUqpv+Cpfww5IB2mH5D6UvMJ+dR5QOPIp4ZwR5RFCTGiwqzFAsigQNCVD1hFjt1VYQg1BnGl4mZuRjNWFqkWWjUOqte1hFtNWCCKpreS7yqs945yQT5FnJNU9S1VTk+zOI3GqepJY35U1h34cz0/5uIHFd4C8cS3td5v8bIgBpgVdPHfmmyhUqLEB/wqEgU9Clt9csEi0FSzE2nWpdTQbb6yD6f71wxz9m3ntcjzCNoF62j9XRSHXbJkewdwbyVmkVUf+/sx2ObkBZI7sphS2eB36borV7c7MrO4JF//EbjCm//fK5cyuHMgewZgJ89J2/ef/EE0e/zjl6GGN9pFKynodNxaIkCUrlMsIl07VRgVHAVRU2HQxNHextxRKNLpfdMvMeGeTNbzfWOrDZ2QKCbQS1MoCOEa4ggBR4UNjVIOHTyA8Knxw/pvD/oM7n3qy2/Y2WiXPOlNUzquYMgfNf9SpQ+iRoT6aEOdCWl2AtLIG3t63KUolRZ9uCDEGIc++9R6kpakESpBqPyqkf1aiX0pXarxrSbMiNLhLVczDrOXxk84Nqn4TPgf9il9Uzn1+jXOy6U2BfHB3Nvnr8+NdU1e4D51+i7UWSBJRj7ki3oSURRen2Xej93aJwU61RF5w7kKQgkODpPdIU/nsBSIJUYyts/3YgKNBmNRL1A90pnQ3UyNwkjXoyyeSgB7J9UvhfB9d/94ujZ9c8PayhOdCXz52bPDMy8q80TYRPPglI3VCmsK2YQvLmLXEIstbXs65NDL5fjxhB2DUELglTD5uZ3ePVbVrj/WZR7ShW/xYNKt0srHnsJwmeknN+VdDg9Ti/wxn+s1NW/sd6whe/2Uzjz4yMDKia82sM+AUqPCRfp/mAaCSC1iNH0fLip6H2dFUcfvwwsW3TunWwlfco2n79FvDa6+JwrSDKloNCoYjs8pJwxqsF787g4l0w9lWjyP98rfrAFb/ZbCO/c+JEhivlrzAHv8IUti/QAKGqw33tSBw/ieRjhxDucU3CR0WGjx1sB+b3/xqh0dEKoRfKJZHTJ21boeoDo56Bv2ZzfG307MVLtcK9etiQJ0VlZOxU/CkO51cZQGcIZKqJoHWkEdu9B/FD+xHp6UakrQ2Ixfxz7nYIUamxRH9cvArrBz9A4cGCmIZ3Z2JNN2FUe/cy2fo3mMK+YZmM0rwNnRa6WQLQydTsDw8f1v6dYXRTKfkCx5djwGGKEgKNEw9qOAw1FUOoNQOtvwfJPQMiLUuE4OGQryH8TvgxBasyTZz2Nywvi3WNpZkZ5MZuo3zhLPKTWXcVTz0fx53Tny8DF887+M4ZC2dLpdI0Y6zkOE6OHlVVFfbh8uXLZEf4VhCAHT58WLdtO8S52FYUYozFdV2nR31EUXaf0vhT7QzPxoDBCo3gNto/6FANhVYI0d6GSFcnjHRKkEKLxcSKX0EMcaCimzau2Q+PGFlYHWeR6hGzoluIwlpeFlvRzfksCvemYM3MojT3QExZi7mLOkvK3YvxJSqC9gD83G3O3nzbZlcmvD3+BNXNKZuc83K5XC5VE6IeGVgTgm8hoRuGWGlh2Iqiatw9RNhijNPzY4y171V5/27Gn8qAHWcMnRVaofKGxAOZCxE6GjpC6SjUWAoaLfdKt8AIR2CkklAjYVeTRKOiLBxtDpFLw4ksoqFyB6yXydsuZ5DLY15FRtALXQMCtmmbWbHoCjmbBQpFIWh7OYvSfJ7WaAlSrAoTqwXvjvQ8zeHPcn7lgYOLFx3l8gecZ7OMiSyR7P9qkDyChLAsa5HIoGnaYjUR1iTA4cOHDcuy2g3DaGOMxYJCr/fD9Jji3Dil8P5uht6MgqNRxnYLzUClZ6j6WN3e9UaAnCGjOkUyr0BnEHuLPKjiGBFFPPfWBiJsAF6tACKO6hGDiCMevffk/+vBDuxBpPoB8n+7WIJZLAjBomjC8krVkICtkiVGsy/k4DKwwH3VuXchcA5k88DkAtj5Bdu506jQ6yFIhnK5PMs5n/3ytWvL0lFk6wk/FAp12ooS2cgPSzIMMpYizZBh6ImB9xMhokA3gziK3liTFBuEWKrm5Q4qspBVBy2uiUA2jpEjVssZW6v8bD0EhE1/Cxy3C4xNksAnOe5e5cq9Sc7zsg+b7fv6P8st0zSpHMrktWvXltY/L4Axoe430gD5nRxQPgtMn7XZtMb52TiYToRoY05LUmEpQQru9KcYa1eBDJHC26FMpKAhT+fON532EytopCMVdKgCI3tTqC5IXQ3OyRGjUVuizRgkaNpzkeV8psyUrBT2LFcWZ4BlV+BKcKkW2yrBS5AGJ7+tHMgx1P0Bqhfwv/bvbzUMo7sR9d8MJLMJdM04oLcwprcDMUmMGOfxiMKSBmMtOndSGlg0zhAzgWgEiIpCFiu1DGQhY6lJZD7aJXiQQI0uBGF+pS+ZupMskrM0wtMm4dJmizzDnAHkcxzLFnheCnmZsdyCw7NS0Iucl2lQBPtA9gO2EZ4pKJRKpSlN02YuX74s7mPNHyUS/O8DB2KMsTZN01q2mgjVDax+Tf4OEYQeJUnk+0QWeiTC0CORhh6JOPRI5KFHIlDFdcGi67YH3J9WI2HSo8n5YsHhYiZMCpaek3DpkQRMj1LIte5ruwVdz/6bppkj+1/tCDbSmFWRgBf+bRsZmiFJENVtkcSRIAI183uLnFfkY6VQ12rLw+yPRoQeDAeDzp9EU40ljUAJIJkPUBQlTo8yHyBVLxHjUeiMZshTD4/SPVTfiydoglDnMgfAOafFgCUa7V+6fNmind/1EkIbvjlJBnoeTBApiqJ7zxEgBh5lcjxqCJI1IGTIuJ6eBJI99L94Lj6vqiVP6A1lyrZSCH6KWJKCHiUZguQgYvhfqiKIhCSKxMedMFYNDVQtXPmkjpBRLWh6JGHTYzMTQEE8rE6tSQ4JqT3oOZEk8JqPOqSpxuYL7G4cqxbxSUFKYQbfk4IMCjf4eh0h11XlG8WjMqpEO2TlKoIki0Q1aWqRJBAGVkCSaivgrAgsiFVLroKCDApTQgo1IFiJh7ph4VEhwJa1P0iiWkTaLL4UEFzgN6uF9ojsOtnBDnawgx3sYAc7QE38f0Rm63exoxjOAAAAAElFTkSuQmCC';
  var IMG = DATA_URI;
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    IMG = chrome.runtime.getURL('pet.png');
  }

  /* ------------------------- 鸭子吱吱声（合成） ------------------------- */
  var audioCtx = null;
  function getCtx() {
    try {
      if (!audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        audioCtx = new AC();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (e) {
      return null;
    }
  }
  function playDuck() {
    var ctx = getCtx();
    if (!ctx) return;
    var now = ctx.currentTime;
    function burst(t0) {
      var f0 = 950 + Math.random() * 150;
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f0, now + t0);
      osc.frequency.exponentialRampToValueAtTime(340, now + t0 + 0.09);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now + t0);
      g.gain.exponentialRampToValueAtTime(0.28, now + t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + 0.11);
      var noise = ctx.createBufferSource();
      var buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * 0.12)), ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      noise.buffer = buf;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1500;
      bp.Q.value = 1.3;
      var ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now + t0);
      ng.gain.exponentialRampToValueAtTime(0.12, now + t0 + 0.008);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + t0 + 0.10);
      osc.connect(g).connect(ctx.destination);
      noise.connect(bp).connect(ng).connect(ctx.destination);
      osc.start(now + t0);
      osc.stop(now + t0 + 0.12);
      noise.start(now + t0);
      noise.stop(now + t0 + 0.12);
    }
    burst(0);
    burst(0.16);
  }

  /* --------------------------- 构建桌宠 UI --------------------------- */
  var host = document.createElement('div');
  host.id = '__pickpet_host__';
  var shadow = host.attachShadow({ mode: 'open' });

  var style = document.createElement('style');
  style.textContent = [
    ':host { all: initial; }',
    '.pet-wrap {',
    '  position: fixed; left: 0; top: 0;',
    '  z-index: 2147483647;',
    '  width: ' + PET_SIZE + 'px; height: ' + PET_SIZE + 'px;',
    '  cursor: grab;',
    '  user-select: none; -webkit-user-select: none;',
    '  touch-action: none;',
    '  will-change: transform;',
    '  transform: translate3d(0,0,0);',
    '}',
    '.pet-wrap img {',
    '  display: block; width: 100%; height: 100%;',
    '  object-fit: contain;',
    '  pointer-events: none;',
    '  will-change: transform;',
    '  filter: drop-shadow(0 5px 12px rgba(0,0,0,0.28));',
    '}',
    /* 待机：轻微上下浮动 */
    '.pet-wrap img.idle { animation: pet-bob 2.6s ease-in-out infinite; }',
    '@keyframes pet-bob {',
    '  0%,100% { transform: translateY(0) scale(1); }',
    '  50%     { transform: translateY(-5px) scale(1); }',
    '}',
    /* 拎起：倾斜角度由 JS 按拖动速度实时计算 */
    '.pet-wrap img.picking { }',
    /* 悬停微放大 */
    '.pet-wrap img.hovering { transform: scale(1.06); transition: transform 0.12s ease; }',
    /* 点击压扁 */
    '.pet-wrap img.squash { animation: pet-squash 0.42s cubic-bezier(.22,.61,.36,1); }',
    '@keyframes pet-squash {',
    '  0%   { transform: scale(1,1); }',
    '  22%  { transform: scale(1.42, 0.58); }',
    '  45%  { transform: scale(0.88, 1.14); }',
    '  68%  { transform: scale(1.22, 0.82); }',
    '  85%  { transform: scale(0.97, 1.03); }',
    '  100% { transform: scale(1,1); }',
    '}',
    /* 落地压扁：轻一点 */
    '.pet-wrap img.land { animation: pet-land 0.30s cubic-bezier(.22,.61,.36,1); }',
    '@keyframes pet-land {',
    '  0%   { transform: scale(1.0, 1.0); }',
    '  30%  { transform: scale(1.22, 0.78); }',
    '  65%  { transform: scale(0.92, 1.08); }',
    '  100% { transform: scale(1,1); }',
    '}'
  ].join('\n');
  shadow.appendChild(style);

  var wrap = document.createElement('div');
  wrap.className = 'pet-wrap';
  var img = document.createElement('img');
  img.src = IMG;
  img.alt = 'PICKCAT 小桌宠';
  img.draggable = false;
  img.addEventListener('error', function () {
    if (img.src !== DATA_URI) img.src = DATA_URI; // 包内图片加载失败则回退内嵌图
  });
  wrap.appendChild(img);
  shadow.appendChild(wrap);

  function attach() {
    if (!document.body) { setTimeout(attach, 50); return; }
    if (!host.isConnected) document.body.appendChild(host);
  }
  attach();

  /* --------------------------- 重力物理引擎 --------------------------- */
  var vw = document.documentElement.clientWidth || window.innerWidth;
  var vh = document.documentElement.clientHeight || window.innerHeight;
  var floorY = vh - PET_SIZE - FLOOR_GAP;   // 地面：桌宠 top 坐标

  var px = vw - PET_SIZE - 24;              // 初始 x（右下角）
  var py = floorY;                          // 初始 y（落在地面）
  var velY = 0;                             // 垂直速度
  var falling = false;                      // 是否受重力下落
  var held = false;                         // 是否被拎起
  var moved = false;
  var startX = 0, startY = 0;
  var offsetX = 0, offsetY = 0;
  var resting = true;

  // 拖拽物理倾斜
  var heldTilt = 0;         // 当前倾斜角（度）
  var prevPx = px;          // 上一帧水平位置，用于计算拖动速度

  function updateFloor() {
    var nvw = document.documentElement.clientWidth || window.innerWidth;
    var nvh = document.documentElement.clientHeight || window.innerHeight;
    vw = nvw; vh = nvh;
    floorY = nvh - PET_SIZE - FLOOR_GAP;
    if (py > floorY) py = floorY;
    if (px > nvw - PET_SIZE) px = nvw - PET_SIZE;
    if (px < 0) px = 0;
  }
  window.addEventListener('resize', updateFloor);

  function applyPos() {
    wrap.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)';
  }

  // 一次性小动画：点击压扁 / 落地压扁
  function doSquash(kind) {
    var cls = (kind === 'land') ? 'land' : 'squash';
    img.classList.remove('squash', 'land', 'idle');
    void img.offsetWidth;
    img.classList.add(cls);
    setTimeout(function () {
      img.classList.remove('squash', 'land');
      if (!held) img.classList.add('idle');
    }, kind === 'land' ? 300 : 420);
  }

  /* --------------------------- 物理主循环 --------------------------- */
  var lastT = null;
  function loop(t) {
    if (lastT == null) lastT = t;
    var dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;

    // 未被拎起且受重力 → 积分
    if (!held && falling) {
      velY += GRAVITY * dt;
      py += velY * dt;
      if (py >= floorY) {
        py = floorY;
        if (velY > 120) {           // 有实际速度 → 反弹
          velY = -velY * BOUNCE;
          doSquash('land');
          if (Math.abs(velY) < 90) {
            velY = 0; falling = false; resting = true;
          }
        } else {                    // 速度很小 → 直接落地休息
          velY = 0; falling = false; resting = true;
          if (!held) img.classList.add('idle');
        }
      }
    }

    // 拎起时按拖动速度物理倾斜：往哪边拖就往哪边倾，越快倾角越大
    if (held) {
      var vx = (px - prevPx) / Math.max(dt, 1e-3);
      prevPx = px;
      var target = Math.max(-MAX_TILT, Math.min(MAX_TILT, vx * TILT_K));
      heldTilt += (target - heldTilt) * 0.30;
      img.style.transform = 'rotate(' + heldTilt.toFixed(1) + 'deg) scale(1.1)';
    } else {
      if (heldTilt !== 0) {
        heldTilt = 0;
        img.style.transform = '';
      }
      prevPx = px;
    }

    applyPos();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* --------------------------- 交互：拎起 / 放下 / 点击 --------------------------- */
  function cp(e) {
    var t = e.touches && e.touches[0];
    return { x: t ? t.clientX : e.clientX, y: t ? t.clientY : e.clientY };
  }

  function onDown(e) {
    var p = cp(e);
    var r = wrap.getBoundingClientRect();
    offsetX = p.x - r.left;
    offsetY = p.y - r.top;
    startX = p.x; startY = p.y;
    held = true; moved = false;
    falling = false; velY = 0;
    resting = false;
    img.classList.remove('idle', 'squash', 'land', 'hovering');
    img.classList.add('picking');
    e.preventDefault();
  }

  function onMove(e) {
    if (!held) return;
    var p = cp(e);
    if (Math.abs(p.x - startX) + Math.abs(p.y - startY) > CLICK_TOLERANCE) moved = true;
    if (!moved) return;
    px = Math.max(0, Math.min(p.x - offsetX, vw - PET_SIZE));
    py = Math.max(0, Math.min(p.y - offsetY, vh - PET_SIZE));
    applyPos();
    e.preventDefault();
  }

  function onUp(e) {
    if (!held) return;
    held = false;
    img.classList.remove('picking');

    if (!moved) {
      // 原地点击 → 压扁 + 鸭子声（留在原地，不受重力）
      playDuck();
      doSquash('click');
      resting = true;
    } else {
      // 拖动后松手 → 释放重力，开始下落
      falling = true;
      velY = 0;
    }
    img.classList.remove('hovering');
    moved = false;
  }

  wrap.addEventListener('mousedown', onDown);
  wrap.addEventListener('touchstart', onDown, { passive: false });
  wrap.addEventListener('mouseenter', function () {
    if (!held) img.classList.add('hovering');
  });
  wrap.addEventListener('mouseleave', function () {
    img.classList.remove('hovering');
  });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchend', onUp);
  document.addEventListener('mouseleave', onUp);
  document.addEventListener('selectstart', function (e) {
    if (held) e.preventDefault();
  });
})();
